const DBConnection = require("../modules/DB");
const Crypto = require('../modules/Crypto');

class UserService {

    static getAllUsers = async () => {
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        return connection.collection.find().toArray()
    }

    static createUser = async (user) => {
        console.log(user);
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        connection.collection.insertOne({username:user.username, password: user.password,
            friends:user.friends, games: user.games},  (err, result) => {
            console.log(result)
            return result
        });
    }

    static findUser = async (user) => {
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        return connection.collection.find({username: user.username, password: Crypto.hash(user.password)}).toArray()
    }

    static getFriends = async (user) => {
        console.log(user);
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        return connection.collection.find(
            { username : user.username},
            { friends: 1, _id: 0}
        ).toArray();
    }

    static getGames = async (user) => {
        console.log(user);
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        return connection.collection.find(
            { username : user.username},
            { games: 1, _id: 0}
        ).toArray();
    }

    static getStats = async () => {
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        return connection.collection.aggregate([
            {
                $lookup: {
                    from: "Games",
                    let: { user: "$username" },
                    pipeline: [
                        { $match: { $expr: { $eq: [ "$$user", "$winner" ] } } },
                        { $count: "count" }
                    ],
                    as: "wins"
                }
            },
            {
                $unwind: "$wins"
            }
        ]).toArray()
    }

    static addGame = async (user, gameID) => {
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        connection.collection.updateOne(
            { username: user},
            { $push: { games: gameID }  },
        )
    }

    static addFriend = async (user, friend) =>{
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        connection.collection.updateOne(
            { username: user},
            { $push: { friends: friend }  },
        )
    }

    static doesExist = async (nick) => {
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        const user = await connection.collection.findOne(
            { username: nick }
        )
        return user !== null && user !== undefined;
    }

    static friendExists = async (user, friend)=>{
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        const result = await connection.collection.find(
            { id:user, friends : {$elemMatch: friend}}
        )
        return result !== null && result !== undefined;
    }

    static removeFriend = async (user, friend)=>{
        console.log('u:', user)
        console.log('f:', friend)
        const connection = await DBConnection.connect("Users", DBConnection.getClient());
        const result = await connection.collection.updateOne({username:user}, {$pull:{friends:friend}});
        console.log(result);
        return result;
    }
}


module.exports = {UserService}