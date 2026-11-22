import pathlib
import sys
import shlex
import paramiko

ssh = paramiko.SSHClient()
ssh.load_host_keys(str(pathlib.Path.home() / '.ssh' / 'known_hosts'))
ssh.connect('92.112.192.11', username='dev', key_filename=str(pathlib.Path.home() / '.ssh' / 'id_hostinger'), timeout=20)
try:
    if sys.argv[1] == 'upload':
        target = sys.argv[3]
        if not target.startswith('/home/dev/phase1-release-20261112/') or '..' in target:
            raise ValueError('Upload must stay in the deployment staging directory')
        stdin, stdout, stderr = ssh.exec_command('umask 077; cat > ' + shlex.quote(target))
        stdin.write(pathlib.Path(sys.argv[2]).read_bytes())
        stdin.flush()
        stdin.channel.shutdown_write()
        if stdout.channel.recv_exit_status() != 0:
            raise RuntimeError('Deployment upload failed')
        print('Uploaded deployment file.')
    elif sys.argv[1] == 'run':
        _, stdout, stderr = ssh.exec_command(sys.argv[2], timeout=120)
        print(stdout.read().decode('utf-8', errors='replace'))
        errors = stderr.read().decode('utf-8', errors='replace')
        if errors:
            print(errors, file=sys.stderr)
        sys.exit(stdout.channel.recv_exit_status())
    else:
        raise ValueError('Unsupported deployment action')
finally:
    ssh.close()
