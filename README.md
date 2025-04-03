```
apt update && apt install -y curl git screen
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

```
git clone https://github.com/bangpateng/teatx.git
cd teatx
```

```
npm i
```

```
cat <<EOF > .env
RPC_URL=https://tea-sepolia.g.alchemy.com/public
PRIVATE_KEY=MASUKAN-PK-KAMU-TANPA-0x
MIN_AMOUNT=0.001
MAX_AMOUNT=0.01
INTERVAL_MINUTES=1
EOF
```

```
screen -S tea
node main.js
```

Save `CTRL A + D Enter`
Back to Screen `screen -r tea`

