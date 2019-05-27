```
name:         | automounter
compiler:     | nodejs
<<<<<<< HEAD
version:      | v1.0.0, 20190521
=======
version:      | v1.10, 201905--
>>>>>>> 1ac1a4c... Rebased
```

# Development Notes
* TODO : Trying to add fallback to nmblookup
* Added 

# Automounter

## Description:

This script will compare your connected and defined networks in the text-based database and will connect to the given share with the network of lowest priorty. Shares can be defined on multiple networks so that you can connect to them automatically in your home/work or vpn network and not trying to mount on public networks.

Since SMB4k unfortunately not working as intended on my system, I made this crude implementation to suffice.

## Setup

In initial run it will generate the database while ./database/setup.json file which needs to be edited with the parameters.

## Dependencies

* For now only Linux platform is supported.
* samba-common
* nmblookup has to be configured, since this is a crude implementation it uses nmblookup to lookup the WINS name of the device in network