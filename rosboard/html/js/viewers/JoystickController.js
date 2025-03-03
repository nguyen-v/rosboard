"use strict";

class JoystickController extends Viewer {
  /**
    * Called when the Viewer is initialized.
    * @override
  **/
  onCreate() {
    // Create a container for the joysticks within the card
    // Create a container for the joysticks within the card
    this.viewer = $('<div></div>')
      .css({
        'font-size': '11pt',
        "filter": "invert(100%) saturate(50%)",
        "display": "flex",  // Add this to use flexbox layout
        "width": "100%",    // Ensure the container takes full width
        "height": "250px"   // Set a fixed height for the container
      })
      .appendTo(this.card.content);

    // Create a container for the left (linear) joystick.
    this.leftJoystickContainer = $('<div id="leftJoystickContainer"></div>')
      .css({
          "position": "relative",
          "width": "50%",
          "height": "100%",    // Changed to 100% of parent
          // Remove float: left since we're using flexbox
          "border": "1px solid #ccc"
      })
      .appendTo(this.viewer);

    // Create a container for the right (angular) joystick.
    this.rightJoystickContainer = $('<div id="rightJoystickContainer"></div>')
      .css({
          "position": "relative",
          "width": "50%",
          "height": "100%",    // Changed to 100% of parent
          // Remove float: left since we're using flexbox
          "border": "1px solid #ccc"
      })
      .appendTo(this.viewer);

    // Create the left joystick (for linear control)
    this.leftJoystick = nipplejs.create({
      zone: this.leftJoystickContainer.get(0),
      mode: 'semi',
      color: 'green',
      size: 150,
      catchDistance: 300
    });

    // Create the right joystick (for angular control)
    this.rightJoystick = nipplejs.create({
      zone: this.rightJoystickContainer.get(0),
      mode: 'semi',
      color: 'red',
      size: 150,
      catchDistance: 300
    });

    // Set up event listeners for the left joystick (linear motion)
    this.leftJoystick.on('start', (evt, data) => {
      currentTransport.update_joy({ joystick: "left", x: 0.0, y: 0.0 });
    }).on('end', (evt, data) => {
      currentTransport.update_joy({ joystick: "left", x: 0.0, y: 0.0 });
    }).on('move', (evt, data) => {
      let radian = data.angle.radian;
      let distance = data.distance;
      let linearX = Math.max(Math.min(Math.cos(radian) / 75 * distance, 1), -1);
      let linearY = -Math.max(Math.min(Math.sin(radian) / 75 * distance, 1), -1);
      currentTransport.update_joy({ joystick: "left", x: linearX, y: linearY });
    });

    // Set up event listeners for the right joystick (angular motion)
    this.rightJoystick.on('start', (evt, data) => {
      currentTransport.update_joy({ joystick: "right", x: 0.0 });
    }).on('end', (evt, data) => {
      currentTransport.update_joy({ joystick: "right", x: 0.0 });
    }).on('move', (evt, data) => {
      let radian = data.angle.radian;
      let distance = data.distance;
      // Using horizontal movement (cosine) for angular control
      let angularX = Math.max(Math.min(Math.cos(radian) / 75 * distance, 1), -1);
      currentTransport.update_joy({ joystick: "right", x: angularX });
    });
  }

  onData(msg) {
    this.card.title.text(msg._topic_name);
  }
}

JoystickController.friendlyName = "JoystickController";
JoystickController.supportedTypes = [
    "geometry_msgs/msg/TwistStamped",
];
JoystickController.maxUpdateRate = 10.0;
Viewer.registerViewer(JoystickController);
