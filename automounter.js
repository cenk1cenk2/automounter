/*
 * File: /automounter.js
 * -------------------------
 * File Created: 20190518
 * Author: Cenk Kılıç (cenk@kilic.dev)
 * -------------------------
 * Last Modified: 20190601
 * Modified By: Cenk Kılıç (cenk@kilic.dev>)
 * Changelog:----------------
 * Date          By      Ver      Comments
 * -----------   ----    ----     ---------------------------------------------------------
 * 20190601      CK      v1.20    Added command line arguments for overriding some default settings.
 * 20190530      CK      v1.11    Added enabled flag to database.
 * 20190527      CK      v1.10    Added fallback IP option to database.
 * 20190523      CK      v1.01    Formatted output with color and padding.
 * 20190518      CK      v1.00    Initial Version
 */

// Print logo
console.log(`     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     |a|u|t|o|m|o|u|n|t|e|r| v${require('./package.json').version}
     +-+-+-+-+-+-+-+-+-+-+-+-+-+-+ `)
console.log('----------------------------------------')

// initial control libraries
const os = require('os')
const isRoot = require('is-root')
const chalk = require('chalk')
const pad = require('pad')
const args = require('./libraries/argumentparser')
const path = require('path')

// Check if the platform is compatible
if (os.platform() !== 'linux') {
  console.error(chalk.bgRed(`${pad('CLIENT', 20)} | ${pad('PLATFORM', 15)} | This script is only compatible with Linux platform.`))
  process.exit(2)
} else if (!isRoot()) {
  // Check if running as root
  console.error(chalk.bgRed(`${pad('CLIENT', 20)} | ${pad('PLATFORM', 15)} | This script must run as superuser or sudo since it uses default Linux tools to mount drives and check for networks.`))
  process.exit(3)
}

// custom database imports
const databasetools = require('./libraries/databasetools')
let databaseRelURL
if (!args.config) {
  databaseRelURL = './automounter-db.json'
} else {
  console.log(chalk.yellow(`${pad('OPTIONS', 20)} | ${pad('DB OVERRIDE', 15)} | Running with config flag. Overriding default database path with provided ${args.config}s.`))
  databaseRelURL = args.config
}
const databaseAbsURL = getExternalFile(databaseRelURL)
databasetools.initdatabase(databaseAbsURL)
const database = require(databaseAbsURL)

//  libraries
const underscore = require('underscore')
const moment = require('moment')
const readdirp = require('readdirp')
const { MultiSelect } = require('enquirer')
// custom imports
const networktools = require('./libraries/networktools')
const mounttools = require('./libraries/mounttools')

// decide options according to argument flags
if (args.unmount) {
  console.log(chalk.yellow(`${pad('OPTIONS', 20)} | ${pad('DB UNMOUNT', 15)} | Running with unmount flag. Script will try to unmount all the shares defined in database and terminate.`))
  databaseUnmount()
} else if (args['path-unmount']) {
  console.log(chalk.yellow(`${pad('OPTIONS', 20)} | ${pad('PATH UNMOUNT', 15)} | Running with path-unmount flag. Script will try to unmount all the folders recursively in the mount path. Script will terminate after.`))
  if (args['path-unmount'] === true) {
    args['path-unmount'] = 1
  }
  console.log(chalk.magenta(`${pad('OPTIONS', 20)} | ${pad('PATH UNMOUNT', 15)} | Path-Unmount will recurse in to ${args['path-unmount']} directories.`))
  pathUnmount()
} else if (args.once) {
  console.log(chalk.yellow(`${pad('OPTIONS', 20)} | ${pad('RUNNING ONCE', 15)} | Running with once flag. Script will run once and terminate.`))
  main()
} else if (args.repeat) {
  // run with defined period
  console.log(chalk.yellow(`${pad('OPTIONS', 20)} | ${pad('REPEAT OVERRIDE', 15)} | Running with repeat flag. Overriding default repeat value with provided ${args.repeat}s.`))
  main()
  setInterval(main, args.repeat * 1000)
} else {
  // run with database period
  main()
  setInterval(main, database.client.repeat * 1000)
}

// This is for pkg to resolve external files
function getExternalFile (relPath) {
  if (typeof process.pkg === 'undefined') {
    return relPath
  } else {
    return path.resolve(path.dirname(process.execPath), relPath)
  }
}

async function main () {
  console.log('-------------------------------------------')
  console.log(`New run initiated @ ${moment().format('YMMDD, HH:mm:ss')}`)
  console.log('-------------------------------------------')

  // Get IP addresses of connected networks
  var connectedNetworks = await networktools.getConnectedNetworks()

  // Match connected networks with the known networks
  if (connectedNetworks) {
    var knownNetworks = await networktools.getKnownNetworks(database, connectedNetworks)
  } else {
    knownNetworks = []
  }

  // Sort known and connected networks by priority
  knownNetworks = underscore.sortBy(knownNetworks, 'priority')

  // Drive mount part per computer
  Object.keys(database.mounts).forEach(async (host) => {
    // Check if host is enabled
    if (database.mounts[host].enabled) {
    // Check if given mounts are avaliable in knownNetworks and determine the preffered networks of the mounts
      var prefferedNetworks = await networktools.getPrefferedNetworks(database, host, knownNetworks)
      // only get the network with the highest priorty and check if any network is avalaible else skip this mount
      if (prefferedNetworks.length > 0) {
        var useNetwork = prefferedNetworks[0]
        console.log(`${pad(host, 20)} | ${pad('NETWORK', 15)} | ${useNetwork.name}@${useNetwork.network} /w priority ${useNetwork.priority} is preffered.`)
        database.mounts[host].mounts.forEach(async (shareName) => {
        // Split share name and alias by colon if defined
          shareName = await databasetools.splitShareName(shareName)
          // Check if already mounted
          var alreadyMounted = await mounttools.getAlreadyMounted(database.client.mountDir, shareName.shareAlias)
          // Mount if not already mounted
          if (alreadyMounted !== true) {
            console.log(`${pad(host, 20)} | ${pad('WISH TO MOUNT', 15)} | ${shareName.shareName}@${shareName.shareAlias}`)
            mounttools.mountDrive(database, host, useNetwork, shareName.shareName, shareName.shareAlias)
          } else {
            console.error(chalk.blue(`${pad(host, 20)} | ${pad('ALREADY MOUNT', 15)} | ${shareName.shareName}@${shareName.shareAlias}`))
          }
        })
      } else {
        console.log(chalk.yellow(`${pad(host, 20)} | ${pad('NETWORK', 15)} | Not in same network. Checking if any shares are already mounted.`))
        // umount if not on compatible network
        database.mounts[host].mounts.forEach(async (shareName) => {
        // Split share name and alias by colon if defined
          shareName = await databasetools.splitShareName(shareName)
          var alreadyMounted = await mounttools.getAlreadyMounted(database.client.mountDir, shareName.shareAlias)
          // UNMount if not already mounted
          if (alreadyMounted === true) {
            console.log(`${pad(host, 20)} | ${pad('WISH TO UNMOUNT', 15)} | ${shareName.shareName}@${shareName.shareAlias}`)
            mounttools.unmountDrive(database, host, shareName.shareAlias)
          } else {
            console.error(chalk.blue(`${pad(host, 20)} | ${pad('ALREADY UNMOUNT', 15)} | ${shareName.shareName}@${shareName.shareAlias}`))
          }
        })
      }
    } else {
      console.error(chalk.magenta(`${pad(host, 20)} | ${pad('SKIPPING', 15)} | Skipping host since it is disabled in database.`))
    }
  })
}

async function databaseUnmount () {
  Object.keys(database.mounts).forEach(async (host) => {
    database.mounts[host].mounts.forEach(async shareName => {
      // Split share name and alias by colon if defined
      shareName = await databasetools.splitShareName(shareName)
      var alreadyMounted = await mounttools.getAlreadyMounted(database.client.mountDir, shareName.shareAlias)
      // UNMount if not already mounted
      if (alreadyMounted === true) {
        console.log(`${pad(host, 20)} | ${pad('WISH TO UNMOUNT', 15)} | ${shareName.shareName}@${shareName.shareAlias}`)
        mounttools.unmountDrive(database, host, shareName.shareAlias)
      } else {
        console.error(chalk.blue(`${pad(host, 20)} | ${pad('ALREADY UNMOUNT', 15)} | ${shareName.shareName}@${shareName.shareAlias}`))
      }
    })
  })
}

async function pathUnmount () {
  console.log(chalk.magenta(`${pad('OPTIONS', 20)} | ${pad('PATH UNMOUNT', 15)} | Checking if mounted shares are existing on the path "${database.client.mountDir}" recursively.`))
  console.log(chalk.yellow(`${pad('OPTIONS', 20)} | ${pad('PATH UNMOUNT', 15)} | User will not be prompted and it will be unmounted directly. If you want to get prompted use "-a" or "--ask" flag combined with the same command.`))
  var pathUnmountList = await new Promise((resolve, reject) => {
    var pathUnmountList = []
    readdirp(database.client.mountDir, { entryType: 'directories', depth: args['path-unmount'] }).on('data', async (entry) => {
      var alreadyMounted = await mounttools.getAlreadyMounted(database.client.mountDir, entry.path)
      // Unmount share if mounted
      if (alreadyMounted === true) {
        console.log(chalk.blue(`${pad('PATH UNMOUNT', 20)} | ${pad('FOUND MOUNT DIR', 15)} | ${entry.path}`))
        pathUnmountList.push({ name: entry.path })
      }
    }).on('end', () => {
      // needs some delay after the end, there is a problem with readdirp?
      setTimeout(() => { resolve(pathUnmountList) }, 1000)
    })
  })

  if (pathUnmountList.length === 0) {
    console.error(chalk.bgRed(`${pad('OPTIONS', 20)} | ${pad('PATH UNMOUNT', 15)} | Nothing found to unmount.`))
    process.exit(97)
  }
  if (args.ask) {
    // get user input for if ask flag is set which paths to unmount
    pathUnmountList = await new Promise(resolve => {
      new MultiSelect({
        message: chalk.yellow(`${pad('PATH UNMOUNT', 18)} | ${pad('PROMPT', 15)} | Please select the shares to be unmounted. Use space to toggle.`),
        choices: pathUnmountList
      }).run()
        .then(answer => resolve(answer))
        .catch(console.error)
    })
  } else {
    pathUnmountList = pathUnmountList.map(x => x.name)    
  }
  // unmount the drives
  pathUnmountList.forEach(async (path) => {
    mounttools.unmountDrive(database, database.client.mountDir, path)
  })
}
