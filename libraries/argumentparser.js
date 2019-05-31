/*
 * File: \libraries\argumentparser.js
 * -------------------------
 * File Created: 20190531
 * Author: Cenk Kılıç (cenk@kilic.dev)
 * -------------------------
 * Last Modified: 20190601
 * Modified By: Cenk Kılıç (cenk@kilic.dev>)
 * Changelog:----------------
 * Date          By      Ver      Comments
 * -----------   ----    ----     ---------------------------------------------------------
 * 20190601      CK      v1.20
 */

const argv = require('yargs')
  .usage('Usage: $0 [options] [flags]')
  .option('r')
  .alias('r', 'repeat')
  .describe('r', 'Override the default repeat time in the database.')
  .example('$0 -r 120', 'Override the default repeat time in the database to be 120 seconds.')
  .boolean('o')
  .alias('o', 'once')
  .describe('o', 'Script will run once instead of the default option of repeating.')
  .option('c')
  .alias('c', 'config')
  .describe('c', 'Override the default database location.')
  .example('$0 -c ./cfg.json', 'Override the default database location to "./cfg".')
  .boolean('u')
  .alias('u', 'unmount')
  .describe('u', 'Force unmount all the defined drives in database. Script will terminate after.')
  .option('p')
  .alias('p', 'path-unmount')
  .describe('p', 'Force unmount all the folders recursively in the mount path. Script will terminate after.\n Depth must be supplied to tell how many folders to recurse. Default is 1.')
  .example('$0 -p 2', 'Force unmount all the folders recursively for 2 folder depth like /mntDir/MOUNTPC/SHARENAME')
  .boolean('a')
  .alias('a', 'ask')
  .describe('a', 'Asks the user for prompt before taking action.')
  .help('h')
  .version('v')
  .alias('h', 'help')
  .alias('v', 'version')
  .epilog('For more information please visit readme file at \nautomounter@(https://github.com/cenk1cenk2/automounter/)').argv

module.exports = argv
