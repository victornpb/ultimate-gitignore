#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const S = require('tiny-dedent');
const asciitable = require('asciitable.js');

const TEMPLATE = '_template.txt';
const EXCLUDE = '_exclude.txt';
const OUTPUTNAME = 'ultimate.gitignore';

async function main() {

    // Clone the repo
    if (!fs.existsSync('./gitignore')) {
        info('Cloning gitignore repo...');
        try {
            call(`git clone https://github.com/github/gitignore.git`);
        } catch (err) { error(err); }
        log(1, 'OK');
    }
    else {
        // Update the repo
        info('Updating gitignore repo...');
        try {
            call(`git -C ./gitignore pull origin`);
        } catch (err) { error(err); }
        log(1, 'OK');
    }

    info('Reading template...');
    const template = fs.readFileSync(path.join(__dirname, TEMPLATE), 'utf8');
    log(1, 'OK');
    
    info('Parsing includes...');
    function getGitignore(name) {
        function banner(name) {
            return S(`
                # ${path.basename(name)}
                # https://github.com/github/gitignore/blob/main/${name}.gitignore
                #--------------------------------------------------------------------------------
                `
            );
        }
        log(2, '- Including ' + name);
        const content = fs.readFileSync(path.join('.', name + '.gitignore'), 'utf8');
        return banner(name) + '\n' + content;
    }
    let text = template.replace(/^#include: (.+)/gm, (m, name) => getGitignore(name));
    log(1, 'OK');
    
    info('Reading exclusion list...');
    let exclusionsFile = fs.readFileSync(path.join(__dirname, EXCLUDE), 'utf8');
    log(1, 'OK');

    info('Excluding items...');
    const REPLACEMENT = '# $& (DISABLED BY EXCLUSION LIST)';
    const exclusions = exclusionsFile.match(/^([^#].+)/gm).map(str=>str.trim());
    for (const exclusion of exclusions) {
        log(2, '- ' + exclusion);
        text = text.replace(new RegExp(`^${escapeRegex(exclusion)}$`, 'gm'), REPLACEMENT);
    }
    log(1, 'OK');

    // Write the output file
    fs.writeFileSync(path.join(__dirname, OUTPUTNAME), text, 'utf8');

    // Summary
    log(S(`

        ------------------------------------------------
        Ultimate gitignore generated!
         
          Total:    ${text.split(/$/gm).length} lines (${(text.length / 1024).toFixed(2)} KB)
          Comments: ${text.match(/^#/gm).length} lines
          Rules:    ${text.match(/^[^#\s]+/gm).length} lines
    
        ${path.resolve(OUTPUTNAME)}\n\n
        `));

    // Update the README
    const readme = fs.readFileSync('README.md', 'utf8');
    const outputDescription = '<!-- auto generated do not modify -->\n'+
        asciitable([
            ['', ''],
            null,
            ['Rules', text.match(/^[^#\s]+/gm).length],
            ['Comments', text.match(/^#/gm).length],
            ['Total', text.split(/$/gm).length + ' lines (' + (text.length / 1024).toFixed(2) + ' KB)'],
        ], gihubTable);


    const newReadme = replaceBetween(readme, '<!--SUMMARY-->', '<!--END-->', `\n${outputDescription}\n`);
    fs.writeFileSync('README.md', newReadme);
}



const gihubTable = {
  row: {
    paddingLeft: '|',
    paddingRight: '|',
    colSeparator: '|',
    lineBreak: '\n'
  },
  cell: {
    paddingLeft: ' ',
    paddingRight: ' ',
    defaultAlignDir: -1
  },
  hr: {
    str: '-',
    colSeparator: '|'
  }
};

// ----------- Utility functions ----------
function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
function call(cmd) {
    return child_process.execSync(cmd).toString();
}
function exec(cmd) {
    console.group('  $ ' + cmd);
    const r = child_process.execSync(cmd).toString();
    if (r) console.log(indent(r));
    console.groupEnd('  $ ' + cmd);
}
function indent(str, level=0) {
    return String(str).replace(/^/gm, '  '.repeat(level));
}
function error(...args) {
    const LINE1 = '-'.repeat(80);
    const LINE2 = '='.repeat(80);
    if (args.length > 1) {
        // get last argument as error (this is to show the stack trace above the error message instead of below)
        let err = args.slice(-1);
        console.log(LINE1);
        console.log('\n [STACK TRACE] \n');
        args.length === 2 ? console.error(new Error(err)) : console.error(...args);
    }
    console.log(LINE2);
    console.log('\n [ERROR]', [...args].join('\n\n'), '\n');
    console.log(LINE2);
    process.exit(1);
}
function log() {
    const args = [...arguments];
    const level = typeof args[0] === 'number' ? args.shift() : 0; 
    console.log(indent(args.join(' '), level));
}
function info() {
    log('\n●', ...arguments)
}
function replaceBetween(str, startString, endString, substitute) {
    const startIndex = str.indexOf(startString);
    const endIndex = str.indexOf(endString, startIndex + startString.length);
    return (startIndex !== -1 && endIndex !== -1) ? str.slice(0, startIndex + startString.length) + substitute + str.slice(endIndex) : str;
}

main();
