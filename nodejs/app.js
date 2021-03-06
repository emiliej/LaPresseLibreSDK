/**
 * @author Bastien Caubet <bastien@nextinpact.com>, Luc Raymond <luc@nextinpact.com>
 * 
 * The MIT License (MIT) Copyright (c) 2016 INpact Mediagroup
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var express = require("express");
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');

var config = require("./config");
var AESCrypt = require("./utils/AesCrypt");
var LPLMiddleware = require("./utils/Middleware");
var InscriptionPartenaire = require("./utils/InscriptionPartenaire");


var VerifModel = require("./models/VerificationModel");
var CreaModel = require("./models/CreationCompteModel");
var UserInfosModel = require("./models/UserInfosModel");
var ValidResModel = require("./models/ValidationReponseModel").ValidationModel;
var Etat = require("./models/ValidationReponseModel").Etat;
var MajModel = require("./models/MajCompteModel");



var app = express();
app.set('port', process.env.PORT || 8888);
app.use(bodyParser.text());

if(app.get("env") == "development") {
    app.use(errorHandler());
    
    app.use(function (req, res, next) {
        next();
    });
}


/**
 * Exemple de la génération d'une url pour l'inscription partenaire
 */
app.get("/inscription-partenaire", function (req, res) {
    res.setHeader("Content-Type", "text/plain");
    res.end(InscriptionPartenaire.GenerateUrl("toto@gmail.com", "tata"));
});


/**
 * Web-service de vérification
 */
app.get("/ws/verification", LPLMiddleware.CheckRequestHeaders, function (req, res) {
    var model = new UserInfosModel();
    var crypt = new AESCrypt();
            
    if(LPLMiddleware.IsTestingContext(req)) {
        // Ne pas modifier
        model.CreateDummyModel();
    } else {
        var json = LPLMiddleware.GetJsonFromRequest(crypt, req.query.crd);

        var vModel = new VerifModel(json);

        // TODO : à modifier
        // Ajoutez ici votre logique de verification des donnees en base à partir de l'objet vModel
        // Exemple de composition du modele à partir des donnees en base
        model.Mail = "testabo@gmail.com";
        model.CodeUtilisateur = "123123-1231-123-12311";
        model.AccountExist = true;
        model.PartenaireID = config.values.PARTENAIRE_ID;
        model.TypeAbonnement = "Mensuel";
        model.DateExpiration = new Date();
        model.DateSouscription = new Date();
    }

    var response = crypt.rijndael256Encrypt(config.values.AES_KEY, config.values.IV, JSON.stringify(model));
    
    LPLMiddleware.AddResponseHeaders(res);

    res.status(200).end(response);
});


/**
 * Web-service de création de compte
 */
app.post("/ws/creationCompte", LPLMiddleware.CheckRequestHeaders, function(req, res) {
    var crypt = new AESCrypt();
    var model = new ValidResModel();
    
    if(LPLMiddleware.IsTestingContext(req)) {
        // Ne pas modifier
        model.CreateDummyModel();
    } else {
        var json = LPLMiddleware.GetJsonFromRequest(crypt, req.body);

        var cModel = new CreaModel(json);
        
        // TODO : à modifier
        // Ajoutez ici votre logique de verification des donnees en base a partir de l'objet cModel
        // Exemple de composition du modele a partir des donnees en base
        model.PartenaireID = config.values.PARTENAIRE_ID;
        model.CodeUtilisateur = cModel.CodeUtilisateur;
        model.IsValid = true;
        model.CodeEtat = Etat.Success;
    }

    var response = crypt.rijndael256Encrypt(config.values.AES_KEY, config.values.IV, JSON.stringify(model));
    
    LPLMiddleware.AddResponseHeaders(res);

    res.status(200).end(response);
});


app.put("/ws/majCompte", LPLMiddleware.CheckRequestHeaders, function(req, res) {
    var crypt = new AESCrypt();
    var model = new ValidResModel();
    
    var json = LPLMiddleware.GetJsonFromRequest(crypt, req.body);

    var majModel = new MajModel(json);

    // TODO : à modifier
    // Ajoutez ici votre logique de verification des donnees en base a partir de l'objet majModel
    // Exemple de composition du modele a partir des donnees en base
    model.PartenaireID = config.values.PARTENAIRE_ID;
    model.CodeUtilisateur = majModel.CodeUtilisateur;
    model.IsValid = true;
    model.CodeEtat = Etat.Success;
    
    var response = crypt.rijndael256Encrypt(config.values.AES_KEY, config.values.IV, JSON.stringify(model));
    
    LPLMiddleware.AddResponseHeaders(res);

    res.status(200).end(response);
});


app.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});