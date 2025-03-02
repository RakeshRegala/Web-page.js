const express = require('express')
const app = express()
const port = 3000

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');


var serviceAccount = require("./key.json");


initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();


app.set('view engine', 'ejs');


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/signin', (req, res) => {
    res.render('signin');
  })

 

    app.get('/signinsubmit', (req, res) => {
      const email = req.query.mail;
      const password = req.query.pass;
  
      db.collection('Users')
      .where("email", "==", email)
      .where("password", "==", password)
      .get()
      .then((docs) => {
        if (docs.size>0) {
          var UsersData=[];
          db.collection('Users').get()
          .then((docs)=>{
            docs.forEach((doc)=>{
              UsersData.push(doc.data());
            });
          })
          .then(()=>{
            console.log(UsersData);
            res.render("home.ejs", {userdata:UsersData});

          });
      } else {
          res.send("Invalid email or password");
      }
  });
});
  


app.get('/signupsubmit', (req, res) => {
    const firstname = req.query.First_Name;
    const lastname = req.query.Last_Name;
    const email = req.query.mail;
    const password = req.query.pass;


    db.collection('Users').add({
      name:firstname+lastname,
      email:email,
      password:password
  }).then(()=>{
    res.send("Signup successful");
  })
})

  app.get('/signup', (req, res) => {
    res.render('signup');
  })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
