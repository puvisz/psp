const express = require('express')
const mysql = require('mysql');

const app = express();
app.use(express.json());

// MySQL Connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'mydatabase',
    port: '3306'
})

connection.connect((err) => {
    if (err) {
        console.log('Error connecting to MySQL database = ', err)
        return;
    }
    console.log('MySQL successfully connected!');
})

// Basic authentication middleware
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (username !== 'admin' || password !== 'admin') {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    next();
}

// CREATE 
app.post("/create", auth, async (req, res) => {
    const { packageName, pricePerUnit, createDate } = req.body;

    try {
        connection.query(

            "INSERT INTO package(PACKAGE_NAME, PRICE_PER_UNIT, CREATE_DATE) VALUES(?, ?, ?)",
            [packageName, pricePerUnit, createDate],
            (err, results, fields) => {
                if (err) {
                    console.log("Error while inserting a data into the database", err);
                    return res.status(400).send();
                }
                return res.status(201).json({ message: "New data successfully created!" });
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
})

// READ
app.get("/read", auth, async (req, res) => {
    try {
        connection.query("SELECT * FROM package", (err, results, fields) => {
            if (err) {
                console.log(err);
                return res.status(400).send();
            }
            res.status(200).json(results)
        })
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
})


// SEARCH data from db
app.get("/search/", auth, async (req, res) => {
    const packageName = req.query.packageName;
    const pricePerUnit = req.query.pricePerUnit;
    const createDate = req.query.createDate;

    try {
        let query = "SELECT * FROM package WHERE 1=1";
        let params = [];

        if (packageName) {
            query += " AND PACKAGE_NAME = ?";
            params.push(packageName);
        }

        if (pricePerUnit) {
            query += " AND PRICE_PER_UNIT = ?";
            params.push(pricePerUnit);
        }

        if (createDate) {
            query += " AND CREATE_DATE = ?";
            params.push(createDate);
        }

        connection.query(query, params, (err, results, fields) => {
            if (err) {
                console.log(err);
                return res.status(400).send();
            }
            // Sort the results by pricePerUnit using Bubble Sort algorithm
            let n = results.length;
            for (let i = 0; i < n - 1; i++) {
                for (let j = 0; j < n - i - 1; j++) {
                    if (results[j].PRICE_PER_UNIT > results[j + 1].PRICE_PER_UNIT) {
                        let temp = results[j];
                        results[j] = results[j + 1];
                        results[j + 1] = temp;
                    }
                }
            }
            res.status(200).json(results);
        });
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
});


// UPDATE data
app.patch("/update/:packageId", auth, async (req, res) => {
    const packageId = req.params.packageId;
    const packageName = req.body.packageName;
    const pricePerUnit = req.body.pricePerUnit;
    const createDate = req.body.createDate;

    try {
        connection.query("UPDATE package SET PACKAGE_NAME = ?, PRICE_PER_UNIT = ?, CREATE_DATE = ? WHERE PACKAGE_ID = ?", [packageName, pricePerUnit, createDate, packageId], (err, results, fields) => {
            if (err) {
                console.log(err);
                return res.status(400).send();
            }
            res.status(200).json({ message: "Updated successfully!" });
        })
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
})


// DELETE
app.delete("/delete/:packageId", auth, async (req, res) => {
    const packageId = req.params.packageId;

    try {
        connection.query("DELETE FROM package WHERE PACKAGE_ID = ?", [packageId], (err, results, fields) => {
            if (err) {
                console.log(err);
                return res.status(400).send();
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "No data with that packageId!" });
            }
            return res.status(200).json({ message: "Data deleted successfully!" });
        })
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
})

app.listen(3000, () => console.log('Server is running on port 3000'));