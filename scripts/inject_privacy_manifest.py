import os
import glob

def main():
    privacy_src = os.path.abspath("ios/App/App/PrivacyInfo.xcprivacy")
    if not os.path.exists(privacy_src):
        print(f"PrivacyInfo.xcprivacy not found at {privacy_src}")
        return

    print(f"Using PrivacyInfo source: {privacy_src}")

    # 1. Copy into any GTMAppAuth pod directories
    for root, dirs, files in os.walk("ios/App/Pods"):
        for d in dirs:
            if "GTMAppAuth" in d:
                target_dir = os.path.join(root, d)
                print(f"Copying PrivacyInfo to {target_dir}")
                res_dir = os.path.join(target_dir, "Resources")
                os.makedirs(res_dir, exist_ok=True)
                with open(privacy_src, "rb") as src_f:
                    data = src_f.read()
                with open(os.path.join(res_dir, "PrivacyInfo.xcprivacy"), "wb") as dst_f:
                    dst_f.write(data)
                with open(os.path.join(target_dir, "PrivacyInfo.xcprivacy"), "wb") as dst_f:
                    dst_f.write(data)

    # 2. Patch Pods-App-frameworks.sh to guarantee PrivacyInfo.xcprivacy is inside GTMAppAuth.framework before codesigning
    frameworks_script = "ios/App/Pods/Target Support Files/Pods-App/Pods-App-frameworks.sh"
    if os.path.exists(frameworks_script):
        with open(frameworks_script, "r") as f:
            content = f.read()

        injection = f'''
    if [ -d "$destination/GTMAppAuth.framework" ]; then
      echo "Injecting PrivacyInfo.xcprivacy into $destination/GTMAppAuth.framework"
      cp -f "{privacy_src}" "$destination/GTMAppAuth.framework/PrivacyInfo.xcprivacy"
    fi
'''
        if "code_sign_if_enabled" in content and "Injecting PrivacyInfo.xcprivacy" not in content:
            content = content.replace("code_sign_if_enabled", injection + "\n    code_sign_if_enabled", 1)
            with open(frameworks_script, "w") as f:
                f.write(content)
            print("Successfully patched Pods-App-frameworks.sh with GTMAppAuth privacy manifest!")
        else:
            print("Pods-App-frameworks.sh already patched or code_sign_if_enabled not found.")

if __name__ == "__main__":
    main()
