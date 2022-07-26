const mysql = require("mysql2")

const DATABASE_URL = 'mysql://lnjvzmfjx2xs:pscale_pw_-0SK_oMK_JG-6ywbY4zxKFkirb1MOiw566nocrrwAis@xvvb2acg505j.us-east-3.psdb.cloud/smart-mirror?ssl={"rejectUnauthorized":true}'

exports.handler = async (event) => {
    const id = event.queryStringParameters.id

    const connection = mysql.createConnection(DATABASE_URL)
    var [results, fields, err] = await connection.promise().query(`
        SELECT * FROM images WHERE smart_mirror_id=${id};
    `)
    connection.end()

    const response = {
        statusCode: 200,
        body: results,
    };
    return response;
};
