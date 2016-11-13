node make.js
rm tongyi/content/* -rf
cp tongyi_content/* tongyi/content/ -r
cd tongyi
../hugo -t $THEME_NAME
node ../server.js
