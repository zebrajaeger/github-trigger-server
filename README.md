# github-trigger-server

receiver for a github curl trigger

# Configure github repo

create a file 

    .github/workflows/trigger.yml
 
and fill with content (replace &lt;myserver&gt; with your server host/path):

```yaml
on: push
jobs:
  curl:
    runs-on: ubuntu-latest
    env:
      GH_REPO: 'repo={{ github.repository }}'
      GH_SHA: 'sha=${{ github.sha }}'
      GH_REF: 'ref=${{ github.ref }}'
      GH_TOKEN: 'key='${{ github.token }}'
    steps:
    - name: curl
      uses: wei/curl@v1
      with:
        args: -X POST -d $GH_REPO -d $GH_SHA -d $GH_REF -d GH_TOKEN https://<myserver>
```

That sends a 
## configure server

### code

clone this repo

    git clone https://github.com/zebrajaeger/github-trigger-server.git

create a config (ignored by git)

    cd github-trigger-server
    nano config.json

and fill with content (replace with your data):
```json
{
    "repo": "zebrajaeger/website",
    "ref": "refs/heads/release",
    "onlyLastTrigger": true,
    "command": "node /home/zebrajaeger/website/install/index.js",
    "key": "****",
    "port": 4444
}
```

You can ignore repo, ref and key. 
That means the server ignores the request parameter. 
Otherwise, it compares the config and request value and only triggers the command if both values have exact the same value.

I strongly recommend put this server behind a reverse proxy (like nginx). 
That also has the advantage to use [Letsencrypt](https://letsencrypt.org/) for a https connection.  

### Nginx with letsencrypt (optional but recommended)

Follow the steps in this document:

- https://www.nginx.com/blog/using-free-ssltls-certificates-from-lets-encrypt-with-nginx/

A site configuration with Letencrpy my look like this (replaced %lt;myserver&gt; with your server name, also the port 4444):

    server {
        root /var/www/<myserver>;
        index index.html;
        server_name <myserver>;
        
        listen [::]:443 ssl; # managed by Certbot
        listen 443 ssl; # managed by Certbot
        ssl_certificate /etc/letsencrypt/live/<myserver>/fullchain.pem; # managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/<myserver>/privkey.pem; # managed by Certbot
        include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
    
        location / {
            proxy_http_version 1.1;
            proxy_cache_bypass $http_upgrade;

            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_pass http://localhost:4444;
        }
    }

    server {
        if ($host = <myserver>) {
        return 301 https://$host$request_uri;
        } # managed by Certbot
    
    
        listen 80;
        listen [::]:80;
        server_name <myserver>;
        return 404; # managed by Certbot
    }


## Test

local test (http)

    curl -v -X POST -d 'repo=zebrajaeger/website' -d 'ref=refs/heads/release' -d 'key=1234' localhost:4444

via proxy (https)

    curl -v -X POST -d 'repo=zebrajaeger/website' -d 'ref=refs/heads/release' -d 'key=1234' https://<myserver>
