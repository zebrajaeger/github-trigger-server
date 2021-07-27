# github-trigger-server

receiver for a github curl trigger

# Configure github repo

create a file 

    .github/workflows/trigger.yml
 
and fill with content (replace &lt;myserver&gt;):

```yaml
on: push
jobs:
  curl:
    runs-on: ubuntu-latest
    env:
      TOKEN: ${{ github.token }}
      GH_REPO: {{ github.repository }}
      GH_SHA: ${{ github.sha }}
      GH_REF: ${{ github.ref }}
      GH_TOKEN=${{ github.token }}
    steps:
    - name: curl
      uses: wei/curl@v1
      with:
        args: -X POST -F '' https://<myserver>
```

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
    "port": 80
}
```

I strongly recommend using another port and put this server behind a reverse proxy (like nginx). 
That also has the advantage to use letsencrypt for a https connection.  

## Test

local test (http)

    curl -v -X POST -d 'repo=zebrajaeger/website' -d 'ref=refs/heads/release' -d 'key=1234' localhost:4444

via proxy (https)

    curl -v -X POST -d 'repo=zebrajaeger/website' -d 'ref=refs/heads/release' -d 'key=1234' https://<myserver>
