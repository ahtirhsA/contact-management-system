const express=require('express')
const app=express()



const {open}=require('sqlite')
const sqlite3=require('sqlite3')

const path=require('path')
const dbpath=path.join(__dirname,'Contact_Book.db')

const bcrypt=require('bcrypt')
const Joi=require('joi')

const jwt=require('jsonwebtoken')


const nodemailer = require('nodemailer'); 
require('dotenv').config();

const NodeCache=require('node-cache')
const otpCache=new NodeCache({stdTTL: 300});

const { formatInTimeZone } = require('date-fns-tz');
const { error } = require('console')

let db;

const initializeConnection=async ()=>{
  try{
    db=await open(
        {
           filename:dbpath,
           driver:sqlite3.Database
        }
    )
    app.listen(3004,()=>{
        console.log('Server is running at http://localhost:3004');
    })
  }
  catch(e){
    console.log(`The Error Message is ${e}`);
  }
}

initializeConnection()




app.get('/',(req,res)=>{
    res.send('Hello Node!!!')
})


const userSchema=Joi.object(
    {
        Name:Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password:Joi.string().min(6).required(),
        confirmPassword:Joi.string().valid(Joi.ref('password')).required()
          .messages({'any.only':'Passwords do not match'})
    }
)

const userPswrdSchema=Joi.object(
    {
        email: Joi.string().email().required(),
        newPassword:Joi.string().min(6).required(),
        confirmPswrd:Joi.string().valid(Joi.ref('newPassword')).required()
          .messages({'any.only':'Passwords did not matched'})
    }
)

const contactSchema=Joi.object({
   name:Joi.string().required(),
   email:Joi.string().required(),
   phone:Joi.string().pattern(/^\+?[1-9]\d{0,14}$/).required(),
   address: Joi.string().required(),
   timezone: Joi.string().required(),
})

const batchContactSchema = Joi.array().items(contactSchema);

const updSchema=Joi.object({
    id:Joi.number().required(),
    name:Joi.string().required(),
    email:Joi.string().required(),
    phone:Joi.string().pattern(/^\+?[1-9]\d{0,14}$/).required(),
    address: Joi.string().required(),
    timezone: Joi.string().required(),
 })

 const batchupdSchema = Joi.array().items(updSchema);

app.use(express.json())


const transporter=nodemailer.createTransport({
    service:'Gmail',
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    },
})


// Register Route

app.post('/register', async (req,res)=>{

    console.log(req.body)

    const {error}=userSchema.validate(req.body)

    if (error){
       return  res.status(400).json({ message:`Validation error: ${error.details[0].message}`});
    }

    const {Name,email,password}=req.body

    const checkDb=`
       SELECT * FROM User WHERE email='${email}';
    `

    const resCheck=await db.get(checkDb)

    if (resCheck===undefined){
        const hashedPassword=await bcrypt.hash(password,10)

        const insrtQuery=`
           INSERT INTO User(name,email,password)
           VALUES('${Name}','${email}','${hashedPassword}');
        `

        await db.run(insrtQuery)

        const verificationToken = jwt.sign({email:email},process.env.JWT_SECRET,)

        const verificationUrl = `http://localhost:3004/verify-email?token=${verificationToken}`;
        


        const mailOptions = {
            from:process.env.EMAIL_USER ,
            to: email,
            subject: 'Email Verification',
            text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
          };

          transporter.sendMail(mailOptions,(error, info) => {
            if (error) {
              return console.log(error);
            }
            console.log('Email sent: ' + info.response)
        });

        return res.status(201).json({ message: 'User registered successfully! Please check your email for verification.' });


    }
    else{

        return res.status(400).json({ message: 'User already exists!' });

    }

})


// Email Verification Route

app.get('/verify-email', async (req,res)=>{
    const {token}=req.query

    if (!token) {
        return res.status(400).send('Invalid verification link.');
    }

    jwt.verify(token,process.env.JWT_SECRET, async (error,payload)=>{
        if (error){
            return res.status(400).send('Invalid or expired token.');
        }
        else{
            const updQuery=`
               UPDATE User SET verified= 1 WHERE email='${payload.email}';
            `
            await db.run(updQuery);
            return res.send('Email verified successfully! You can now log in.');

        }
    })
})

// Login Route 

app.post('/login', async (req,res)=>{
    
    const {email,password}=req.body

    const regUser=`
      SELECT * FROM User WHERE email='${email}';
    `

    const runQue=await db.get(regUser)

    if (runQue!==undefined){
        const cmpPswrd=await bcrypt.compare(password,runQue.password)

        if (cmpPswrd){
            const genToken=jwt.sign({id:runQue.id,email:email},process.env.IDT_SECRET)
            const keyy=`jwtToken${runQue.id}`
            return res.send({[keyy]:genToken}) 
        }
        else{
           res.status(401).send('Invalid Password!!!')
        }
    }

    else{
       return  res.status(404).send('User does not exists!!!')
    }

})

// Forgot Password Route

app.post('/forgot-password',async (req,res)=>{

    const {email}=req.body

    const chk=`
       SELECT * FROM User WHERE email='${email}';
    `

    const chkRun=await db.get(chk)

    if (chkRun!==undefined && chkRun.verified===1){

      const generateOtp=Math.floor(100000 + Math.random() * 900000) // 6-digit otp

      otpCache.set(email, generateOtp);


      const userMailOptions={
        from:process.env.EMAIL_USER ,
        to: email,
        subject: 'Reset Password',
        text: `Your OTP is ${generateOtp}`,
      }

      transporter.sendMail(userMailOptions,(error)=>{
        if (error){
           return res.status(500).send({ message: 'Failed to send OTP', error: error.message });
        }
        return res.status(200).send({ message: 'OTP sent successfully!' });
      })

    }

    else if (chkRun!==undefined && chkRun.verified !== 1) {
        return res.status(401).send('User has not verified their email address. Please verify your email before resetting the password.');
    }

    else{
        return res.status(404).send('User does not exists!!!') 
    }


})


// Password Reset Route

app.post('/reset-password',async (req,res)=>{

    const {email,otp,newPassword,confirmPswrd}=req.body

    const {error}=userPswrdSchema.validate({email,newPassword,confirmPswrd})    

    if (error){
        return  res.status(400).json({ message: `Validation error: ${error.details[0].message}` });
    }


    const userCheck = `SELECT * FROM User WHERE email='${email}';`;
    const user = await db.get(userCheck);

    if (!user) {
        return res.status(404).send('User does not exist!');
    }

    const cachedOtp=otpCache.get(email)

    console.log(cachedOtp)


    if(cachedOtp===undefined){
        return res.status(400).send('OTP has expired or is invalid!');
    }

    if(cachedOtp!==otp){
        return res.status(400).send('Invalid OTP!');
    }


    const newHashPswrd=await bcrypt.hash(newPassword,10)

    const updPswrd=`
          UPDATE User SET password='${newHashPswrd}' WHERE email='${email}';
    `

    await db.run(updPswrd)

    return res.status(201).send('Password Updated Successfully!!!')
    
})

// AUTHORIZATION MIDDLE WARE

const middleWare=(req,res,next)=>{
    const authHead=req.headers['authorization']
    let jwtToken;

    if (authHead){

        jwtToken=authHead.split(' ')[1]

        if (jwtToken){
          
          jwt.verify(jwtToken,process.env.IDT_SECRET,(error,payload)=>{
            if (error){
                return res.status(400).send('JWT Token not matched!!!')   
            }
            req.payload=payload
            next()
          })


        }
        else{
            return res.status(400).send('JWT Token is not defined!!!')   
        }
       
    }
    else{
        return res.status(400).send('Authorization is not defined!!!')
    }
}


// New Contact 


app.post('/new-contact',middleWare,async (req,res)=>{

    const {error}=contactSchema.validate(req.body)

    if (error){
        return  res.status(400).json({ message:`Validation error: ${error.details[0].message} `});
    }
     
    const {name,email,phone,address,timezone}=req.body

    const luserId=req.payload.id

    const addContact=`
       INSERT INTO Contacts(name,email,phone,address,timezone,created_at,updated_at,userId)
       VALUES('${name}','${email}','${phone}','${address}','${timezone}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,${luserId});
    `
    try {
        await db.run(addContact);
        return res.status(201).json({ message: 'Contact added successfully!' });
    } catch (err) {

        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ message: 'A contact with this email or phone already exists.' });
        }
        return res.status(500).json({ message: 'Error adding contact', error: err.message });
    }
})

// Retrieve Contacts

app.get('/contacts',middleWare,async (req,res)=>{

    const {timezone,sortBy,order,startDate,endDate}=req.query

    const retrieveContacts=`
       SELECT * FROM Contacts
       WHERE timezone='${timezone}' AND 
       strftime('%Y-%m-%d', created_at) BETWEEN '${startDate}' AND '${endDate}'
       ORDER BY ${sortBy} ${order.toUpperCase()}
     
    `
   
   try{

    const runQuery=await db.all(retrieveContacts)


    const convertedUTC=(time,zone)=>{
        const date = new Date(time);
        return formatInTimeZone(date,zone,'yyyy-MM-dd HH:mm:ssXXX')

    }

    if (runQuery.length>0){
        const modArr=runQuery.map((i)=>{
            return {...i,created_at:convertedUTC(i.created_at,i.timezone),updated_at:convertedUTC(i.updated_at,i.timezone)}
        })
        return res.status(200).json(modArr);
    }
    else{
        return res.status(404).json({ message: 'No contacts found.' });
    }

 }
 catch(e){
    return res.status(500).json({message:`The Error is ${e}`});
 }

   
    
})

// UPDATE Contact


app.put('/update-contact/:id',middleWare,async (req,res)=>{

    const {id}=req.params

    const chkContact=`
       SELECT * FROM Contacts WHERE id=${id};
    `

    const runChkQuery=await db.get(chkContact)

    if (runChkQuery===undefined){
        return res.status(404).json({message:'Contact does not exist!!'})
    }

    
    if (req.payload.id!==runChkQuery.userId){
        return res.status(401).json({message:'This Contact does not belongs to you!!!'})
     }

    const {error}=contactSchema.validate(req.body)

    if (error){
        return  res.status(400).json({ message: error.details[0].message });
    }
     

    const {name,email,phone,address,timezone}=req.body

    const updQuery=`
       UPDATE Contacts SET 
       name='${name}',
       email='${email}',
       phone='${phone}',
       address='${address}',
       timezone='${timezone}' ,
       updated_at=CURRENT_TIMESTAMP
       WHERE id=${id};
    `

   try{
    await db.run(updQuery);
    return res.status(200).json({message:'Contact updated successfully!!!'})
   }
   catch(e){
    return res.status(500).json({message:`The Error is ${e}`})
   }
})

// DELETE Contact

app.put('/delete-contact/:id',middleWare,async (req,res)=>{

    const {id}=req.params

    const chkCnt=`
       SELECT * FROM Contacts WHERE id=${id};
    `

    const runCntQuery=await db.get(chkCnt)

    if (runCntQuery===undefined){
        return res.status(400).json({message:'Contact does not exist!!'})
    }

    if (req.payload.id!==runCntQuery.userId){
        return res.status(400).json({message:'This Contact does not belongs to you!!!'})
     }

    const delQuery=`
       UPDATE Contacts SET is_deleted=1 WHERE id=${id};
    `

    try{
        await db.run(delQuery);
        return res.status(200).json({message:'Delete Status updated successfully!!!'})
       }
       catch(e){
        return res.status(500).json({message:`The Error is ${e}`})
       }
})

// BATCH PROCESSING FOR ADDING CONTACTS

app.post('/contacts/batch',middleWare,async (req,res)=>{
    const {contacts}=req.body

    const {error}=batchContactSchema.validate(contacts)

    if (error){
        return res.status(400).json({message:error.details[0].message})
    }

   try{

    for (let i of contacts){

       const bQry=`INSERT INTO Contacts(name,email,phone,address,timezone,created_at,updated_at,userId)
       VALUES('${i.name}','${i.email}','${i.phone}','${i.address}','${i.timezone}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,${req.payload.id})`;

       await db.run(bQry)

    }

    return res.status(200).json({ message: "Contacts added successfully" });
 }
 catch(e){
    return res.status(500).json({ message: "Error inserting contacts", error: e.message });

 }


})

// BATCH PROCESSING FOR UPDATING CONTACTS

app.put('/contacts/batch',middleWare,async (req,res)=>{
    const {updContacts}=req.body

    const {error}=batchupdSchema.validate(updContacts)

    if (error){
        return res.status(400).json({message:`Validation error: ${error.details[0].message}`})
    }

 try{

    for (let i of updContacts){


     const qry=`
       SELECT * FROM Contacts WHERE id=${i.id};
     `
     const resQry=await db.get(qry)

      if(resQry.id!=undefined){ 

       if (resQry.userId===req.payload.id){
            const uQry=`
               UPDATE Contacts SET 
               name='${i.name}',
               email='${i.email}',
               phone='${i.phone}',
               address='${i.address}',
               timezone='${i.timezone}' ,
               updated_at=CURRENT_TIMESTAMP
               WHERE id=${i.id};
               `;

            await db.run(uQry)
        }
        else{
            console.log('Contact does not belong to u!!!')
            continue
        }
     
      }
      else{
        console.log('Id is not in Contacts')
        continue
      }
    }

    return res.status(200).json({ message: "Contacts updated successfully" });
    
 }
 catch(e){
    return res.status(500).json({ message: "Error while updating contacts", error: e.message });

 }


})










