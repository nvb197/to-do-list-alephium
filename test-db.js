import mongoose from 'mongoose';

const uri = 'mongodb://nvbach197:nvbach197@ac-aqhcqdv-shard-00-00.qjz5n1f.mongodb.net:27017,ac-aqhcqdv-shard-00-01.qjz5n1f.mongodb.net:27017,ac-aqhcqdv-shard-00-02.qjz5n1f.mongodb.net:27017/todo_db?ssl=true&replicaSet=atlas-c8k8ye-shard-0&authSource=admin&retryWrites=true&w=majority&appName=ToDoListBlockchain';

mongoose.connect(uri)
    .then(() => {
        console.log('Connected!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
