var lx = 0.0, ly = 0.0, lz = 0.0, ax = 0.0, ay = 0.0, az = 0.0;

var app = new Vue({
    el: "#app",
    data: {
        connected: false,
        ros: null,
        ws_address: 'ws://192.168.1.18:9090',
        logs: [],
        loading: false,
        topic: null,
        message: null,
    },
    methods: {
        connect: function(){
            this.logs.unshift('Attempting to Connect')
            this.ros = new ROSLIB.Ros({
                url: this.ws_address
            })
            this.ros.on('connection', () => {
                this.connected = true
                this.logs.unshift('Connected!')
            })
            this.ros.on('error', function(error) {
                console.log('Error connecting to the server: ', error)
            })
            this.ros.on('close', () => {
                this.connected = false
                this.logs.unshift('Disconnected!')
            })
        },
        disconnect: function(){
            this.ros.close()
        },
        setTopic: function(){
            this.topic = new ROSLIB.Topic({
                ros: this.ros,
                name: '/cmd_vel',
                messageType: 'geometry_msgs/Twist'
            })
        },
        getImage: function(){
            this.topic = new ROSLIB.Topic({
                ros: this.ros,
                name: 'camera/image_raw/compressed',
                messageType: 'sensor_msgs/CompressedImage'
            })
            this.topic.subscribe(function(message) {
                var imageData = "data:image/jpg;base64," + message.data
                document.getElementById('cam').src = imageData
                if(this.connected == false){
                    this.topic.unsubscribe();
                    document.getElementById('cam').src = "placeholder.png";
                }
            })
        },
        forward: function(){
            this.message = new ROSLIB.Message({
                linear: {
                    x: lx,
                    y: 0.0,
                    z: 0.0
                },
                angular: {
                    x: 0.0,
                    y: 0.0,
                    z: 0.0
                },
            })
            this.setTopic()
            this.topic.publish(this.message)
        },
        stop: function(){
            this.message = new ROSLIB.Message({
                linear: {
                    x: 0.0,
                    y: 0.0,
                    z: 0.0
                },
                angular: {
                    x: 0.0,
                    y: 0.0,
                    z: 0.0
                },
            })
            this.setTopic()
            this.topic.publish(this.message)
        },
        turnLeft: function(){
            this.message = new ROSLIB.Message({
                linear: {
                    x: 0.0,
                    y: 0.0,
                    z: 0.0
                },
                angular: {
                    x: 0.0,
                    y: 0.0,
                    z: az
                },
            })
            this.setTopic()
            this.topic.publish(this.message)
        },
        turnRight: function(){
            this.message = new ROSLIB.Message({
                linear: {
                    x: 0.0,
                    y: 0.0,
                    z: 0.0
                },
                angular: {
                    x: 0.0,
                    y: 0.0,
                    z: -az
                },
            })
            this.setTopic()
            this.topic.publish(this.message)
        },
        backward: function(){
            this.message = new ROSLIB.Message({
                linear: {
                    x: -lx,
                    y: 0.0,
                    z: 0.0
                },
                angular: {
                    x: 0.0,
                    y: 0.0,
                    z: 0.0
                },
            })
            this.setTopic()
            this.topic.publish(this.message)
        },
    },
})

function recieveJoystickData(data){
    console.log(data);
    const obj = JSON.parse(data);
    document.getElementById("theta").innerHTML = obj.theta;
    document.getElementById("magnitude").innerHTML = obj.magnitude;
    let angle = parseFloat(obj.theta);
    let speed = parseFloat(obj.magnitude) * 0.4;
    
    lx = speed;
    if(angle >= 350.0 || angle <= 10.0){
        app.forward();
    }
    else if(angle <= 190.0 && angle >= 170.0){
        app.backward();
    }
    else if(angle >= 80.0 && angle <= 100.0){
        app.turnRight();
    }
    else if(angle >= 260.0 && angle <= 280.0){
        app.turnLeft();
    }
}

function stopRobot(){
    app.stop();
}
