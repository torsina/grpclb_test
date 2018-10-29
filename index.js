const grpc = require('grpc');
const path = require('path');
const os = require('os');

const protoPath = path.join(__dirname, 'testing.proto');
const proto = grpc.load(protoPath).testing;
const isServer = (process.env.RPC_TYPE === 'server');

let server;
let client;

function serverDoStuff(ctx, callback) {
    console.log(`Processing "doStuff" from "${ctx.request.host}"...`);
    callback(null, {
        message: `Hello, ${ctx.request.name}; hold on while I do things!`,
        host: os.hostname()
    });
}

function clientDoStuff() {
    const dataToSend = {
        name: 'Carl',
        host: os.hostname()
    };

    client.doStuff(dataToSend, (error, response) => {
        if (error) {
            return console.log('An error occurred:', error);
        }

        console.log('Response:', JSON.stringify(response));
    });

    setTimeout(clientDoStuff, 2000);
}
console.log(process.env.RPC_TYPE );
if (Boolean(isServer)) {

    // server
    server = new grpc.Server();
    server.addService(proto.Stuff.service, {doStuff: serverDoStuff});
    server.bind(`0.0.0.0:${process.env.RPC_PORT}`, grpc.ServerCredentials.createInsecure());
    server.start();

    console.log('Listening in server mode...');

} else {

    // client
    client = new proto.Stuff(`dns:///${process.env.RPC_HOST}:${process.env.RPC_PORT}`, grpc.credentials.createInsecure(), {
        'grpc.lb_policy_name': 'round_robin'
    });

    // begin doing stuff
    clientDoStuff();
}
