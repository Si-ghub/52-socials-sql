const mysql = require('mysql2/promise');

const app = {}

app.init = async () => {
    // prisijungti prie duomenu bazes
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'social',
    });

    let sql = '';
    let rows = [];

    function upName(str) {
        return str[0].toUpperCase() + str.slice(1)
    };

    function formatDate(date) {
        const d = new Date(date);
        const dformat = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-') + ' ' +
            [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
        return dformat;
    }
    console.log('');
    console.log(`| 1 |`);
    console.log('');
    sql = 'SELECT `users`.`id`, `firstname`, \
    COUNT(DISTINCT `posts`.`id`) as posts,\
    COUNT(DISTINCT `comments`.`id`) as comments,\
    COUNT(DISTINCT `posts_likes`.`id`) as likes\
    FROM `users`\
    LEFT JOIN `posts`\
        ON `posts`.`user_id` = `users`.`id`\
    LEFT JOIN `comments`\
        ON `comments`.`user_id` = `users`.`id`\
    LEFT JOIN `posts_likes`\
        ON `posts_likes`.`user_id` = `users`.`id`\
    GROUP BY `users`.`id`\
    ORDER BY `register_date` DESC';
    [rows] = await connection.execute(sql);

    console.log(`Users: `);
    i = 0;
    for (let item of rows) {
        console.log(`${++i}. ${upName(item.firstname)}: posts (${item.posts}), comments (${item.comments}), likes (${item.likes});`);
    };

    console.log('');
    console.log(`| 2 |`);
    console.log('');
    sql = 'SELECT `users`.`firstname`, `posts`.`text`, `posts`.`date` \
    FROM `posts` \
    LEFT JOIN `users` \
        ON `users`.`id`=`posts`.`user_id` \
    LEFT JOIN `friends` \
        ON `friends`.`friend_id` = `posts`.`user_id` \
    WHERE `friends`. `user_id` = 2 \
    ORDER BY `posts`. `date` DESC';

    [rows] = await connection.execute(sql);

    console.log(`Ona's feed:`);
    for (let { firstname, text, date } of rows) {
        console.log(`${upName(firstname)} wrote a post "${text}"(${date})`);
    }


    console.log(`| 3 |`);
    console.log('');
    console.log('Not ready yet, too complicated for now');

    console.log('');
    console.log(`| 4 |`);
    console.log('');
    sql = 'SELECT `follow_date`,\
                ( \
                     SELECT `users`.`firstname` \
                     FROM `users` \
                    WHERE `users`.`id` = `friends`.`friend_id` \
                ) as you, \
                 ( \
                     SELECT `users`.`firstname` \
                     FROM `users` \
                    WHERE `users`.`id` = `friends`.`user_id` \
                ) as me \
            FROM `friends`';

    [rows] = await connection.execute(sql);

    count = 0;
    for (const item of rows) {
        console.log(`${++count}. ${upName(item.me)} is following ${upName(item.you)} (since ${formatDate(item.follow_date)});`);
    }

    console.log('');
    console.log(`| 5 |`);
    console.log('');
    sql = 'SELECT `like_options`.`id`, `like_options`.`text`,\
                    `posts_likes`.`like_option_id`, \
                    COUNT(`posts_likes`.`like_option_id`) as panaudota\
            FROM `like_options`\
            LEFT JOIN `posts_likes`\
                ON `posts_likes`.`like_option_id` = `like_options`.`id`\
            GROUP BY `like_options`.`id`\
            ORDER BY `panaudota` DESC';

    [rows] = await connection.execute(sql);
    console.log(`Like options statistics:`);
    count = 0;
    for (let { text, panaudota } of rows) {
        console.log(`${++count}. ${text} - ${panaudota} time;`);
    }

    console.log('');
    console.log(`| 6 | `);
    console.log('');
    async function searchPost(str) {
        sql = 'SELECT * FROM `comments` WHERE `text` LIKE "%' + str + '%"';
        [rows] = await connection.execute(sql);

        if (rows.length === 0) { //tikrinam ar array tuscias
            console.error(`ERROR:Tokio komentaro nera`);
        } else {
            console.log(`Comments with search term "${str}":`);
            count = 0;
            for (let { text, date } of rows) {
                console.log(`${++count}. "${text}" (${formatDate(date)});`);
            }
        }
    };
    await searchPost('nice');
    await searchPost('lol');

    console.log('');
    console.log(`| 7 | `);
    console.log('');
    async function postFinder(userID) {
        sql = 'SELECT `posts`.`text` as text, \
                `posts`.`date` as time, \
                `users`.`firstname` as name\
                FROM `users`\
                LEFT JOIN `posts`\
                    ON `users`.`id` = `posts`.`user_id`\
                WHERE `users`.`id` = '+ userID + '\
                ORDER BY time DESC \
                LIMIT 1';
        [rows] = await connection.execute(sql);

        if (rows.length === 0) {
            console.error(`Seems like this user doesn't exist yet.`)
        }
        else if (rows[0].text) {
            console.log(`Latest post from ${rows[0].name}:`);
            console.log(`'${rows[0].text}' ${formatDate(rows[0].time)}.`);
        }
        else {
            console.error(`Seems like ${rows[0].name} hasn't posted yet`);
        }
    }
    await postFinder(1);
    await postFinder(6);
}
app.init();

module.exports = app;