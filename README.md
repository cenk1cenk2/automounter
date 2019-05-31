```
name:         | automounter
compiler:     | nodejs
version:      | v1.11, 20190530
```

# Automounter

## Description:

This script will compare your connected and defined networks in the text-based database and will connect to the given share with the network of lowest priorty. 

The use case scenerio of this is when you have a mobile workstation like a laptop and not every network is avaliable to the device every given time. Shares can be defined in multiple networks therefor while you can connect to all of them via a common network like a VPN network, you can prioritize a real network like home or work network above it so it will connect directly instead of trying to reach from a VPN network.

Since SMB4k unfortunately not working as intended on my system, I made this crude implementation with this little twist to suffice.

## Dependencies and Prerequisites

* For now only Linux platform is supported.
* nmblookup therefor samba-common has to be configured, since this is a crude implementation it uses nmblookup to lookup the WINS name of the device in network.

## Compiled Version
You can find the compiled version in the [releases](https://github.com/cenk1cenk2/automounter/releases/latest).

## Setup

In initial run it will generate the database while ./automounter-db.json file which needs to be edited with the parameters.

### Configuration of Database

You can easily setup the generated as below.

```
{
  "client": {
    "repeat": 60, (in Seconds)
    "mountDir": "/mnt", (Absolute path to Mount Directory)
    "mountOptions": "vers=3,uid=0,gid=0,iocharset=utf8,file_mode=0775,dir_mode=0775,cache=none" (Options for SAMBA)
  },
  "networks": {
    "home": {
      "network": "192.168.1.*", (As in the form of X.X.X the rest is not important)
      "priority": 10 (Lower the number higher the priority)
    }
    "vpn": {
      "network": "10.10.150.*",
      "priority": 50
    }
  },
  "mounts": {
    "PC01": (it will look up for this name in the nmblookup, so this has to be advertised samba name) {
      "enabled": true (for easily switching depending on the situatation)
      "mounts": ["SHARE01@PC01/DATA_1", "SHARE02@PC01/DATA_2"], ( first part must match the samba share name; if you want to create ALIAS for the share given use @ALIAS after. you can also mount it in subfolders if you use the hiearchy using unix folder structure )
      "available": ["home@.6", "vpn"], (match the exact name in networks section; if you want to create a fallback IP in case of nmblookup fails, @IP or @.IP in /24 netmask will be sufficient)
      "user": "superusername",
      "password": "superpassword"
    }
  }
}
```
