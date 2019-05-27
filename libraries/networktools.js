/*
 * File: /modules/networktools.js
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
const underscore = require('underscore')
const network = require('network')
const pad = require('pad')
const chalk = require('chalk')
const ping = require('ping')

module.exports = {
  getHostIP,
  getConnectedNetworks,
  getKnownNetworks,
  getPrefferedNetworks
}

async function getHostIP (serverName, useNetwork, database) {
  return new Promise((resolve, reject) => {
    // try nmblookup initially
    exec(`nmblookup ${serverName} | grep ${useNetwork.network.match(/^[0-9]*\.[0-9]*\.[0-9]*/)}`, { timeout: 30000 }, (err, stdout, stderr) => {
      if (!err && stdout.search('name_query failed to find name') < 0) {
        resolve(stdout.split(' ')[0])
      } else {
        // fallback to given IP at the database
        console.error(chalk.red(`${pad(serverName, 20)} | ${pad('NETWORK', 15)} | Can not resolve hostname with nmblookup.`))
        console.log(chalk.yellow(`${pad(serverName, 20)} | ${pad('NETWORK', 15)} | Falling back to refering to database for resolving IP.`))
        let fallbackIP = database.mounts[serverName].available.map(avaliableNetwork => { return avaliableNetwork.match(useNetwork.name) })
        if (database.networks[useNetwork.name].network && fallbackIP && fallbackIP[0].input.split('@')[1]) {
          fallbackIP = fallbackIP[0].input
          fallbackIP = database.networks[useNetwork.name].network.match(/^([0-9]*\.[0-9]*\.[0-9]*)/)[1] + '.' + fallbackIP.split('@')[1].match(/\.([0-9]*)/)[1]
          ping.sys.probe(fallbackIP, (isAlive) => {
            isAlive ? resolve(fallbackIP) : reject(chalk.red(`${pad(serverName, 20)} | ${pad('NETWORK', 15)} | Fallback database IP is not responding.`))
          })
        } else {
          reject(chalk.bgRed(`${pad(serverName, 20)} | ${pad('NETWORK', 15)} | Can not resolve host IP.`))
        }
      }
    })
  })
}

// Get IP addresses of connected networks
async function getConnectedNetworks () {
  return new Promise(resolve => {
    network.get_interfaces_list((err, connectedNetworks) => {
      if (err) {
        console.error(chalk.bgRed(`${pad('CLIENT', 20)} | ${pad('NETWORK', 15)} | Not connected to any networks.`))
      }
      resolve(connectedNetworks)
    })
  })
}

// Match connected networks with the known networks
async function getKnownNetworks (database, connectedNetworks) {
  let returnValue = []
  connectedNetworks.forEach(connectedNetwork => {
    Object.keys(database.networks).forEach(network => {
      if (connectedNetwork.ip_address && database.networks[network].network.match(/([0-9]*\.[0-9]*\.[0-9]*)/)[0] === connectedNetwork.ip_address.match(/([0-9]*\.[0-9]*\.[0-9]*)/)[0]) {
        returnValue.push({ name: network, ...database.networks[network] })
      }
    })
  })
  return returnValue
}

async function getPrefferedNetworks (database, host, knownNetworks) {
  return new Promise(resolve => {
    var returnValue = []
    database.mounts[host].available.forEach(avaliable => {
      var query = underscore.findWhere(knownNetworks, { name: avaliable.split('@')[0] })
      if (typeof query !== 'undefined') {
        returnValue.push(query)
      }
    })
    resolve(returnValue)
  })
}
