const fs = require("fs");
const path = require("path");

const {
    handler
} = require(
    "../netlify/functions/football.js"
);


async function updateFootballData() {

    console.log(
        "Преузимање фудбалских података..."
    );


    const response =
        await handler();


    if (
        !response ||
        response.statusCode !== 200
    ) {

        throw new Error(
            response?.body ||
            "Није могуће преузети податке."
        );

    }


    const newData =
        JSON.parse(
            response.body
        );


    const dataFolder =
        path.join(
            __dirname,
            "..",
            "data"
        );


    const filePath =
        path.join(
            dataFolder,
            "football.json"
        );


    if (
        !fs.existsSync(
            dataFolder
        )
    ) {

        fs.mkdirSync(
            dataFolder,
            {
                recursive: true
            }
        );

    }


    /*
        Ne želimo novi Git commit
        ako se tabela i utakmice
        nisu promenile.
    */

    let oldData = null;


    if (
        fs.existsSync(
            filePath
        )
    ) {

        try {

            oldData =
                JSON.parse(
                    fs.readFileSync(
                        filePath,
                        "utf8"
                    )
                );

        }

        catch (error) {

            oldData = null;

        }

    }


    const comparableNew = {
        standings:
            newData.standings,

        matches:
            newData.matches,

        lastMatch:
            newData.lastMatch,

        nextMatch:
            newData.nextMatch
    };


    const comparableOld =
        oldData
            ? {
                standings:
                    oldData.standings,

                matches:
                    oldData.matches,

                lastMatch:
                    oldData.lastMatch,

                nextMatch:
                    oldData.nextMatch
            }
            : null;


    if (
        comparableOld &&
        JSON.stringify(
            comparableOld
        ) ===
        JSON.stringify(
            comparableNew
        )
    ) {

        console.log(
            "Нема промена у подацима."
        );

        return;

    }


    fs.writeFileSync(

        filePath,

        JSON.stringify(
            newData,
            null,
            2
        ),

        "utf8"

    );


    console.log(
        "data/football.json је ажуриран."
    );

}


updateFootballData()
    .catch(error => {

        console.error(
            error
        );

        process.exit(1);

    });