const mysql = require("mysql2")

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
