/*
 * File: /modules/mounttools.js
 * -------------------------
 * File Created: 20190521
 * Author: Cenk Kılıç (cenk@kilic.dev)
 * -------------------------
 * Last Modified: 20190527
 * Modified By: Cenk Kılıç (cenk@kilic.dev>)
 * Changelog:----------------
 * Date          By      Ver      Comments
 * -----------   ----    ----     ---------------------------------------------------------
 * 20190527      CK      v1.10
 * 20190523      CK      v1.01
 * 20190521      CK      v1.00    Initial version.
 */

const { exec } = require('child_process')
const pad = require('pad')
const chalk = require('chalk')
// custom libraries
const networktools = require('./networktools')

module.exports = {
  getAlreadyMounted,
  mountDrive,
  unmountDrive
}

async function getAlreadyMounted (mountDir, shareAlias) {
  return new Promise((resolve, reject) => {
    exec(`if mountpoint -q ${mountDir}/${shareAlias}; then echo "true"; fi`, { timeout: 30000 }, (err, stdout, stderr) => {
      if (!err) {
        if (stdout.search('true') >= 0) {
          resolve(true)
        } else {
          resolve(false)
        }
      } else {
        reject(chalk.red(`${pad('CLIENT', 20)} | ${pad('ERROR', 15)} | Checking while checking mount point.`))
      }
    })
  })
}

async function mountDrive (database, host, useNetwork, shareName, shareAlias) {
  let reachableAddress = await networktools.getHostIP(host, useNetwork.network, database).catch(err => console.error(err))
  if (reachableAddress) {
    let mountCmd = `mkdir -p ${database.client.mountDir}/${shareAlias}; mount -t cifs -o vers=3,username=${database.mounts[host].user},password=${database.mounts[host].password},uid=0,gid=0,iocharset=utf8,file_mode=0775,dir_mode=0775,cache=none //${reachableAddress}/${shareName} ${database.client.mountDir}/${shareAlias}`
    exec(`${mountCmd}`, { timeout: 30000 }, async (err, stdout, stderr) => {
      if (!err) {
        let result = await this.getAlreadyMounted(database.client.mountDir, shareAlias).catch(err => console.error(err))
        if (result) {
          console.log(chalk.green(`${pad(host, 20)} | ${pad('MOUNT', 15)} | //${host}/${shareAlias}`))
        } else {
          console.error(chalk.bgRed(`${pad(host, 20)} | ${pad('ERROR', 15)} | while mounting: //${host}/${shareAlias} ${err}`))
        }
      } else {
        console.error(chalk.bgMagenta(`${pad(host, 20)} | ${pad('OSERROR', 15)} | while trying to mount //${host}/${shareAlias}`))
      }
    })
  } else {
    console.error(chalk.bgRed(`${pad(host, 20)} | ${pad('SKIPPING', 15)} | lookup failed so host might be powered off.`))
  }
}

async function unmountDrive (database, host, shareAlias) {
  let unmountCmd = `umount -l ${database.client.mountDir}/${shareAlias}`
  exec(`${unmountCmd}`, { timeout: 30000 }, async (err, stdout, stderr) => {
    if (!err) {
      let result = await this.getAlreadyMounted(database.client.mountDir, shareAlias)
      if (!result) {
        console.log(chalk.green(`${pad(host, 20)} | ${pad('UNMOUNT', 15)} | //${host}/${shareAlias}`))
      } else {
        console.error(chalk.bgRed(`${pad(host, 20)} | ${pad('ERROR', 15)} | while unmounting: //${host}/${shareAlias} ${err}`))
      }
    } else {
      console.error(chalk.bgMagenta(`${pad(host, 20)} | ${pad('OSERROR', 15)} | while trying to unmount //${host}/${shareAlias} ${err}`))
    }
  })
}
