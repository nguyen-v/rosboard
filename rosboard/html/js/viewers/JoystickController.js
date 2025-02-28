"use strict";

class JoystickController extends Viewer {
  /**
    * Gets called when Viewer is first initialized.
    * @override
  **/
  onCreate() {
    this.viewer = $('<div></div>')
      .css({ 'font-size': '11pt', "filter": "invert(100%) saturate(50%)" })
      .appendTo(this.card.content);

    this.joyId = "joy-" + Math.floor(Math.random() * 10000);
    this.joy = $('<div id="' + this.joyId + '"></div>')
      .css({ "height": "250px" })
      .appendTo(this.viewer);

    var options = {
      zone: document.getElementById(this.joyId),
      mode: 'semi',
      color: 'blue',
      size: 150,
      catchDistance: 300,
    };

    // Helper function to create a TwistStamped message
    function createTwistStampedMessage(joystickX, joystickY) {
      let now = new Date();
      let sec = Math.floor(now.getTime() / 1000);
      // Convert the milliseconds remainder to nanoseconds
      let nanosec = (now.getTime() % 1000) * 1e6;
      return {
        header: {
          stamp: { sec: sec, nanosec: nanosec },
          frame_id: "base_link"
        },
        twist: {
          linear: { x: -joystickY * 3.0, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: -joystickX * 2.0 }
        }
      };
    }

    var manager = nipplejs.create(options);
    manager.on('start', function(evt, data) {
      let joystickX = 0.0;
      let joystickY = 0.0;
      currentTransport.update_joy(createTwistStampedMessage(joystickX, joystickY));
    }).on('end', function(evt, data) {
      let joystickX = 0.0;
      let joystickY = 0.0;
      currentTransport.update_joy(createTwistStampedMessage(joystickX, joystickY));
    }).on('move', function(evt, data) {
      let radian = data['angle']['radian'];
      let distance = data['distance'];
      let joystickX = Math.max(Math.min(Math.cos(radian) / 75 * distance, 1), -1);
      let joystickY = -Math.max(Math.min(Math.sin(radian) / 75 * distance, 1), -1);
      currentTransport.update_joy(createTwistStampedMessage(joystickX, joystickY));
    });
  }

  onData(msg) {
    this.card.title.text(msg._topic_name);
  }
}

JoystickController.friendlyName = "JoystickController";

// Change supported type to TwistStamped
JoystickController.supportedTypes = [
  "geometry_msgs/msg/TwistStamped",
];

JoystickController.maxUpdateRate = 10.0;

Viewer.registerViewer(JoystickController);
