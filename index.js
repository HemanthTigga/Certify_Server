const express = require('express');
const multer = require('multer');
const exceltojson = require('convert-excel-to-json');
const fs = require("fs-extra");
const mongoose = require('mongoose')
const cors = require('cors')
const { createCanvas, loadImage } = require('canvas')
const nodemailer = require('nodemailer')
// const PDFDocument = require('pdfkit');


const app = express()
app.use(cors())
app.use(express.json())
app.set("view engine", "ejs");

var upload = multer({ dest: "uploads/" })

const schemaData = mongoose.Schema({
    id: String,
    Name: String,
    Mobile: String,
    Email: String,
    Amount: String,
    Trees: String,
})

const userModel = mongoose.model("treedoners", schemaData)

const port = process.env.PORT || 5000

// app.get('/certificate',(req,res)=>{
//     res.render('DonateCertificate');
// })


// Function to send certificate email
async function sendCertificateEmail(userData) {
    try {
        const canvas = createCanvas(750, 500);
        const ctx = canvas.getContext('2d');

        const image = await loadImage('./Donation_Certificate.png');
        ctx.drawImage(image, 0, 0, 750, 500);

        const name = userData.Name || 'Default Name';
        const amount = `${userData.Amount || '0'}`;

        // Name
        ctx.font = '25px Impact';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        const nameWidth = ctx.measureText(name).width;
        const xNamePosition = (canvas.width - nameWidth) / 2;
        const yNamePosition = canvas.height / 2;
        ctx.fillText(name, xNamePosition, yNamePosition + 20);

        // Amount
        ctx.font = '8px Impact';
        const amountWidth = ctx.measureText(amount).width;
        const xAmountPosition = (canvas.width - amountWidth) / 2;
        const yAmountPosition = canvas.height / 2;
        ctx.fillText(amount, xAmountPosition + 37, yAmountPosition + 66);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hemumani73@gmail.com',
                pass: 'ejhc lecp kjno orst',
            },
        });

        const mailOptions = {
            from: 'hemumani73@gmail.com',
            to: userData.Email,
            subject: 'Certificate of Donation',
            html: require('fs').readFileSync('./views/emailcertificate.html', 'utf-8'),
            attachments: [
                {
                    filename: 'certificate.png',
                    content: canvas.toBuffer(),
                    encoding: 'base64',
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${userData.Email}`);
    } catch (error) {
        console.error(`Failed to send email to ${userData.Email}: ${error}`);
    }
}

app.post('/read', upload.single('file'), async (req, res) => {
    try {
        if (req.file?.filename == null || req.file?.filename == 'undefined') {
            res.status(400).json("No File")
        } else {
            var filepath = 'uploads/' + req.file.filename
            const excelData = exceltojson({
                sourceFile: filepath,
                header: {
                    rows: 1
                },
                columnToKey: {
                    "*": "{{columnHeader}}",
                },
            });
            const result = await userModel.insertMany(excelData.Sheet1);
            // console.log(result)
            console.log(`${result.length} documents inserted successfully`);
            console.log(excelData)

            // Loop through the inserted documents and send emails
            for (const user of result) {
                await sendCertificateEmail(user);
            }

            fs.remove(filepath)
            res.status(200).json(excelData)
        }
    }
    catch (error) {
        res.status(500)
    }
});

// app.get('/certificate/:id', async (req, res) => {
//     try {
//         const userId = req.params.id;

//         // Fetch user data from the database based on the provided ID
//         const userData = await userModel.findById(userId);

//         if (!userData) {
//             return res.status(404).json({ error: "User not found" });
//         }


//         //generate the certificate image
//         const canvas = createCanvas(750, 500);
//         const ctx = canvas.getContext('2d');

//         const image = await loadImage('./Donation_Certificate.png');
//         ctx.drawImage(image, 0, 0, 750, 500);

//         const name = userData.Name || 'Default Name';
//         const amount = `${userData.Amount || '0'}`;

//         // Name
//         ctx.font = '25px Impact';
//         ctx.fillStyle = 'rgba(255,255,255,1)';
//         const nameWidth = ctx.measureText(name).width;
//         const xNamePosition = (canvas.width - nameWidth) / 2;
//         const yNamePosition = canvas.height / 2;
//         ctx.fillText(name, xNamePosition, yNamePosition + 20);

//         // Amount
//         ctx.font = '8px Impact';
//         const amountWidth = ctx.measureText(amount).width;
//         const xAmountPosition = (canvas.width - amountWidth) / 2;
//         const yAmountPosition = canvas.height / 2;
//         ctx.fillText(amount, xAmountPosition + 37, yAmountPosition + 66);


//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: 'hemumani73@gmail.com',
//                 // pass: 'Hemanth0479@',
//                 pass: 'ejhc lecp kjno orst',
//             },
//         });

//         const mailOptions = {
//             from: 'hemumani73@gmail.com',
//             to: userData.Email,
//             subject: 'Certificate of Donation',
//             // html: '<p>Thank you for your donation! Here is your certificate:</p>',
//             html: require('fs').readFileSync('./views/emailcertificate.html', 'utf-8'),
//             attachments: [
//                 {
//                     filename: 'certificate.png',
//                     content: canvas.toBuffer(),
//                     encoding: 'base64',
//                 },
//             ],
//         };

//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 console.error(error);
//                 return res.status(500).json({ error: 'Failed to send email' });
//             }

//             console.log('Email sent: ' + info.response);
//             res.status(200).json({ message: 'Certificate sent successfully' });
//         });


//         res.set('Content-Type', 'image/png');
//         res.send(canvas.toBuffer());

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });





mongoose.connect("mongodb+srv://hemumani73:sIcAvRZCliyMj7Yi@cluster0.4wd1kim.mongodb.net/tree")
    .then(() => {
        console.log("Connect to DB")
        app.listen(port, () => console.log(`Node.js app listening on PORT ${port}`))
    })
    .catch((err) => console.log(err))
