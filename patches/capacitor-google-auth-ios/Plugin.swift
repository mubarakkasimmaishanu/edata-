import Foundation
import Capacitor
import GoogleSignIn

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 *
 * eData patch: migrated from GoogleSignIn 6.x to GoogleSignIn 7.1+ so the app ships
 * GTMAppAuth/AppAuth/GTMSessionFetcher versions that include Apple privacy manifests
 * (App Store ITMS-91061). Also hardened against nil force-unwrap crashes when the
 * plugin is used before it has been initialized with a valid iOS client ID.
 */
@objc(GoogleAuth)
public class GoogleAuth: CAPPlugin {
    var signInCall: CAPPluginCall?
    var googleSignIn: GIDSignIn?
    var googleSignInConfiguration: GIDConfiguration?
    var forceAuthCode: Bool = false
    var additionalScopes: [String] = []
    private var isObservingOpenUrl = false

    func loadSignInClient (
        customClientId: String,
        customScopes: [String]
    ) {
        let signIn = GIDSignIn.sharedInstance
        let configuration = GIDConfiguration(clientID: customClientId, serverClientID: getServerClientIdValue())
        signIn.configuration = configuration

        googleSignIn = signIn
        googleSignInConfiguration = configuration

        // these are scopes granted by default by the signIn method
        let defaultGrantedScopes = ["email", "profile", "openid"]
        // these are scopes we will need to request after sign in
        additionalScopes = customScopes.filter {
            return !defaultGrantedScopes.contains($0)
        }

        if !isObservingOpenUrl {
            NotificationCenter.default.addObserver(self, selector: #selector(handleOpenUrl(_ :)), name: Notification.Name(Notification.Name.capacitorOpenURL.rawValue), object: nil)
            isObservingOpenUrl = true
        }
    }

    public override func load() {
    }

    @objc
    func initialize(_ call: CAPPluginCall) {
        // get client id from initialize, with client id from config file as fallback
        guard let clientId = call.getString("clientId") ?? getClientIdValue(), !clientId.isEmpty else {
            NSLog("GoogleAuth: no iOS client id found in config")
            call.resolve()
            return
        }

        // get scopes from initialize, with scopes from config file as fallback
        let customScopes = call.getArray("scopes", String.self) ?? (
            getConfigValue("scopes") as? [String] ?? []
        )

        // get force auth code from initialize, with config from config file as fallback
        forceAuthCode = call.getBool("grantOfflineAccess") ?? (
            getConfigValue("forceCodeForRefreshToken") as? Bool ?? false
        )

        // load client
        self.loadSignInClient(
            customClientId: clientId,
            customScopes: customScopes
        )
        call.resolve()
    }

    @objc
    func signIn(_ call: CAPPluginCall) {
        guard let googleSignIn = self.googleSignIn, self.googleSignInConfiguration != nil else {
            call.reject("Google Sign-In is not configured on iOS. Set an iOS OAuth client ID (plugins.GoogleAuth.iosClientId) and call initialize() first.", "NOT_CONFIGURED")
            return
        }
        signInCall = call
        DispatchQueue.main.async {
            if googleSignIn.hasPreviousSignIn() && !self.forceAuthCode {
                googleSignIn.restorePreviousSignIn { user, error in
                    if let error = error {
                        self.signInCall?.reject(error.localizedDescription, "\((error as NSError).code)")
                        return
                    }
                    guard let user = user else {
                        self.signInCall?.reject("Google Sign-In returned no user.")
                        return
                    }
                    self.resolveSignInCallWith(user: user, serverAuthCode: nil)
                }
            } else {
                guard let presentingVc = self.bridge?.viewController else {
                    self.signInCall?.reject("Unable to present Google Sign-In.")
                    return
                }

                let scopes: [String]? = self.additionalScopes.isEmpty ? nil : self.additionalScopes
                googleSignIn.signIn(withPresenting: presentingVc, hint: nil, additionalScopes: scopes) { result, error in
                    if let error = error {
                        self.signInCall?.reject(error.localizedDescription, "\((error as NSError).code)")
                        return
                    }
                    guard let result = result else {
                        self.signInCall?.reject("Google Sign-In returned no result.")
                        return
                    }
                    self.resolveSignInCallWith(user: result.user, serverAuthCode: result.serverAuthCode)
                }
            }
        }
    }

    @objc
    func refresh(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let currentUser = self.googleSignIn?.currentUser else {
                call.reject("User not logged in.")
                return
            }
            currentUser.refreshTokensIfNeeded { user, error in
                guard let user = user else {
                    call.reject(error?.localizedDescription ?? "Something went wrong.")
                    return
                }
                let authenticationData: [String: Any] = [
                    "accessToken": user.accessToken.tokenString,
                    "idToken": user.idToken?.tokenString ?? NSNull(),
                    "refreshToken": user.refreshToken.tokenString
                ]
                call.resolve(authenticationData)
            }
        }
    }

    @objc
    func signOut(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.googleSignIn?.signOut()
        }
        call.resolve()
    }

    @objc
    func handleOpenUrl(_ notification: Notification) {
        guard let object = notification.object as? [String: Any] else {
            print("There is no object on handleOpenUrl")
            return
        }
        guard let url = object["url"] as? URL else {
            print("There is no url on handleOpenUrl")
            return
        }
        _ = googleSignIn?.handle(url)
    }

    func getClientIdValue() -> String? {
        if let clientId = getConfig().getString("iosClientId") {
            return clientId
        }
        else if let clientId = getConfig().getString("clientId") {
            return clientId
        }
        else if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
                let dict = NSDictionary(contentsOfFile: path) as? [String: AnyObject],
                let clientId = dict["CLIENT_ID"] as? String {
            return clientId
        }
        return nil
    }

    func getServerClientIdValue() -> String? {
        if let serverClientId = getConfig().getString("serverClientId") {
            return serverClientId
        }
        return nil
    }

    func resolveSignInCallWith(user: GIDGoogleUser, serverAuthCode: String?) {
        let authentication: [String: Any] = [
            "accessToken": user.accessToken.tokenString,
            "idToken": user.idToken?.tokenString ?? NSNull(),
            "refreshToken": user.refreshToken.tokenString
        ]
        var userData: [String: Any] = [
            "authentication": authentication,
            "serverAuthCode": serverAuthCode ?? NSNull(),
            "email": user.profile?.email ?? NSNull(),
            "familyName": user.profile?.familyName ?? NSNull(),
            "givenName": user.profile?.givenName ?? NSNull(),
            "id": user.userID ?? NSNull(),
            "name": user.profile?.name ?? NSNull()
        ]
        if let imageUrl = user.profile?.imageURL(withDimension: 100)?.absoluteString {
            userData["imageUrl"] = imageUrl
        }
        signInCall?.resolve(userData)
    }
}
