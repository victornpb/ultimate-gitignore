#!/bin/sh

SITE=https://victornpb.github.io/ultimate-gitignore
URL=https://victornpb.github.io/ultimate-gitignore/ultimate.gitignore

echo '-------------------------------------------------------------------------------'
echo " The Ultimate gitignore - $SITE "
echo '-------------------------------------------------------------------------------'
echo ''

# check if a .gitignore file exists
if [ -f .gitignore ]; then
    read -p  'A .gitignore file already exists. Do you want to overwrite it (y/N)? ' -r answer
    if [ "$answer" != "y" ]; then
        echo '\nAborted.'
        exit 1
    fi
fi

# download the latest .gitignore file
echo 'Downloading the latest .gitignore file...'
curl $URL --silent --progress-bar --output .gitignore 

# check if the download was successful
if [ $? -ne 0 ]; then
    echo 'Download failed. Aborting.'
    exit
fi

echo 'Done!'
