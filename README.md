![logo](https://raw.github.com/slikts/wtmap/master/images/icon-128.png)

WT map
=======


WT map is a Chrome extension that enhances the browser-based
map in [War Thunder](http://warthunder.com/). It can be used with multi-monitor
setups or on a different device from the one running the game.

Features
--------

![screenshot](https://raw.github.com/slikts/wtmap/master/images/screenshot.png)

New:

 * Different plane icons for fighters, bombers and attackers
 * Plane icons show plane orientation
 * Proximity alert that plays a sound when the number of nearby enemies increases
 * Configurable options:
   * Proximity alert radius and volume
   * Plane icon size
 * Info in page title:
   * Number of enemies within proximity radius
   * The distance to the closest enemy
   * The total number of allied planes
 * Ground units never obscure plane icons

Planned:

 * Map centering on player
 * Configurable sound for proximity alert

Installation
------------

The extension can be installed from its [Chrome Web Store page](https://chrome.google.com/webstore/detail/gmhaddmfnmddbjgobfjfghpjlbgmeiop).

Usage
-----

The enhanced map can be accessed from the WT map extension options page. 
The map page should be bookmarked for easy access. War Thunder needs to 
be running for the map to work.

To use the map on a different device from the one running the game,
the correct map location should be set in the options. For instance,
if the local IP address of the PC running the game was 192.168.1.1,
the map location would be http://192.168.1.1:8111/. The game process (aces.exe) 
may need to be allowed through the firewall. If one of the devices is wireless
and the other wired, the local network needs to be configured 
to allow them to connect.

Notes
-----

The features added by this extension don't depend on Chrome specific
functionality, and it should be easy to port them to other platforms.

The idea of making this app comes from the
[War Thunder tactical map](https://play.google.com/store/apps/details?id=net.junkcode.warthundertacticalmap)
Android app.

Licence
-------

The project is available under the MIT licence.