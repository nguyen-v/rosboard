"use strict";

class QuaternionViewer extends Space3DViewer {
  onCreate() {
    // Call the base class onCreate to set up the canvas, camera, etc.
    super.onCreate();
    
    // Zoom in by reducing the camera radius.
    this.cam_r = 20.0;
    this.updatePerspective();
    
    // Override gl.ondraw to check for a lineWidth property in our draw objects.
    let that = this;
    this.gl.ondraw = function() {
      that.gl.clear(that.gl.COLOR_BUFFER_BIT | that.gl.DEPTH_BUFFER_BIT);
      if (!that.drawObjectsGl) return;
      for (let i in that.drawObjectsGl) {
        // If a lineWidth is specified, set it; otherwise, default to 1.
        if (that.drawObjectsGl[i].lineWidth) {
          that.gl.lineWidth(that.drawObjectsGl[i].lineWidth);
        } else {
          that.gl.lineWidth(1);
        }
        if (that.drawObjectsGl[i].type === "points") {
          that.shader.uniforms({
            u_color: [1, 1, 1, 1],
            u_mvp: that.mvp
          }).draw(that.drawObjectsGl[i].mesh, that.gl.POINTS);
        } else if (that.drawObjectsGl[i].type === "lines") {
          that.shader.uniforms({
            u_color: [1, 1, 1, 1],
            u_mvp: that.mvp
          }).draw(that.drawObjectsGl[i].mesh, that.gl.LINES);
        }
      }
    };
  }

  onData(msg) {
    // Update the title with the topic name.
    this.card.title.text(msg._topic_name);

    // Extract quaternion components from the IMU message.
    // (ROS sensor_msgs/msg/Imu uses orientation with {x, y, z, w})
    const qx = msg.orientation.x;
    const qy = msg.orientation.y;
    const qz = msg.orientation.z;
    const qw = msg.orientation.w;

    // Convert the quaternion to a 3x3 rotation matrix.
    // Standard conversion formulas:
    const m00 = 1 - 2 * (qy * qy + qz * qz);
    const m01 = 2 * (qx * qy - qz * qw);
    const m02 = 2 * (qx * qz + qy * qw);

    const m10 = 2 * (qx * qy + qz * qw);
    const m11 = 1 - 2 * (qx * qx + qz * qz);
    const m12 = 2 * (qy * qz - qx * qw);

    const m20 = 2 * (qx * qz - qy * qw);
    const m21 = 2 * (qy * qz + qx * qw);
    const m22 = 1 - 2 * (qx * qx + qy * qy);

    // Define a scale factor for the axes length.
    const scale = 4;  // Multiply each axis by 4 to make them twice as long.

    // The rotated axes endpoints (scaled):
    // x-axis: (scale * m00, scale * m10, scale * m20)
    // y-axis: (scale * m01, scale * m11, scale * m21)
    // z-axis: (scale * m02, scale * m12, scale * m22)
    const xAxis = [0, 0, 0, scale * m00, scale * m10, scale * m20];
    const yAxis = [0, 0, 0, scale * m01, scale * m11, scale * m21];
    const zAxis = [0, 0, 0, scale * m02, scale * m12, scale * m22];

    const newAxesPoints = [
      ...xAxis,
      ...yAxis,
      ...zAxis
    ];
    const newAxesColors = [
      1, 0, 0, 1,  1, 0, 0, 1,   // x-axis (red)
      0, 1, 0, 1,  0, 1, 0, 1,   // y-axis (green)
      0, 0.5, 1, 1,  0, 0.5, 1, 1  // z-axis (blue-ish)
    ];

    // Remove the default axes by replacing them with an empty mesh.
    this.axesMesh = GL.Mesh.load({ vertices: [], colors: [] });

    // Draw the grid (from the base class) and our custom thick quaternion axes.
    // We pass a custom draw object with type "thick_axes" and specify a lineWidth.
    this.draw([
      { type: "thick_axes", vertices: newAxesPoints, colors: newAxesColors, lineWidth: 4 }
    ]);
  }

  // Override draw() to process custom draw objects.
  draw(customObjects) {
    let drawObjectsGl = [];
    // Always draw the grid.
    drawObjectsGl.push({ type: "lines", mesh: this.gridMesh });
    // Draw the (now empty) default axes mesh.
    drawObjectsGl.push({ type: "lines", mesh: this.axesMesh });
    // Process our custom objects.
    customObjects.forEach(obj => {
      if (obj.type === "thick_axes") {
        // Create a mesh for the thick axes.
        const mesh = GL.Mesh.load({ vertices: obj.vertices, colors: obj.colors });
        drawObjectsGl.push({ type: "lines", mesh: mesh, lineWidth: obj.lineWidth });
      }
    });
    this.drawObjectsGl = drawObjectsGl;
  }
}

// Advertise this viewer.
QuaternionViewer.friendlyName = "Quaternion Viewer (IMU)";
QuaternionViewer.supportedTypes = [
  "sensor_msgs/msg/Imu"
];
QuaternionViewer.maxUpdateRate = 30.0;
Viewer.registerViewer(QuaternionViewer);
