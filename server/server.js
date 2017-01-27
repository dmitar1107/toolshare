Tools = new Meteor.Collection("tools");
ToolCats = new Meteor.Collection("toolcats");
Feedback = new Meteor.Collection("feedback");
Rental = new Meteor.Collection("rental");
Test = new Meteor.Collection("test");
Prices = new Meteor.Collection("prices");
Transfers = new Meteor.Collection("transfers");
MailData = new Meteor.Collection("MailData");
Setting = new Meteor.Collection("settings");
Request = new Meteor.Collection("request");

// STRIPE_SECRET_KEY = 'sk_test_ACYTsj4IiyfDm86X1s8PeuX7';
STRIPE_SECRET_KEY = getPaymentSetting("secretKey");
STRIPE_SECRET_KEY = STRIPE_SECRET_KEY?STRIPE_SECRET_KEY.value.trim():"";
insurance_fee_percent = getPaymentSetting("insuranceFee");
insurance_fee_percent = insurance_fee_percent?insurance_fee_percent.value.trim():"";
transaction_fee_percent = getPaymentSetting("transactionFee");
transaction_fee_percent = transaction_fee_percent?transaction_fee_percent.value.trim():"";
// STRIPE_SECRET_KEY = Setting.find({key:"secretKey"}).fetch()[0].value;
// insurance_fee_percent = Setting.find({key:"insuranceFee"}).fetch()[0].value;
// transaction_fee_percent = Setting.find({key:"transactionFee"}).fetch()[0].value;

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
    Meteor.startup(function () {
        console.log("server side!!!!!!!");
        var reminderMaking = function () {
            console.log("Reminder Start!");
            reminderAfterConfirmation();
            reminderPickupConfirm();
            reminderReturnTool();
            reminderConfirmReturn();        
         }
        var cron = new Meteor.Cron( {
          events:{
            "* * * * *"  : reminderMaking
          }
        });
    });

    // // This code is for routing external POSTs
    // Meteor.Router.add('/transaction/:id', function(id) {
    //     // update Item Function
    //     console.log('got POST with id = ' + id );
    //     // put transaction handling code here

    //     return [200, 'ok'];
    // });
    Meteor.publish("userData", function () {
      return Meteor.users.find({_id: this.userId},
                               {fields: {'other': 1, 'things': 1}});
    });
    Meteor.publish("allUserData", function () {
        return Meteor.users.find({}, {fields: {"emails.address": 1, "profile": 1, "username":1}});
    });
    // Meteor.publish("getAllUsers", function () {
    //  return Meteor.users.find({}, {fields: {'other': 1, 'things': 1}});
    // });
    Meteor.publish("allRentalData", function () {
        return Rental.find();
    });
    Meteor.publish("getTooList", function(searchFilter, sortby_price) {
        return Tools.find(searchFilter, sortby_price);
    });
    Meteor.publish("getAllFeedback", function() {
        return Feedback.find();
    }); 
    Meteor.publish("getFeedback", function(id) {
        return Feedback.find({toolid: id}, {sort: {date: -1}});
    });
    Meteor.publish("getToolName", function() {
        return Tools.find();
    }); 
    Meteor.publish("getTools", function() {
        return Tools.find();
    });
    Meteor.publish("rentalForConfirmed", function () {
        return Rental.find({flag:1});
    });
    
    Meteor.publish("getToolCats", function () {
        return ToolCats.find( {}, { sort: {_id: 1} });
    });

    Meteor.publish("getPrices", function() {
            return Prices.find( {}, {} );
    });

    Meteor.publish("setPrices", function() {
//        if ( Meteor.call('isAdminCheck') )
        return Prices.find( {}, {} );
    });
    Meteor.publish("getSettings", function () {
        return Setting.find({});
    });


    // In your server code: define a method that the client can call
    Meteor.methods({
        sendEmail: function (to, from, subject, text, html) {
            // Let other method calls from the same client start running,
            // without waiting for the email sending to complete.
            this.unblock();

            Email.send({
                to: to,
                from: from,
                subject: subject,
                text: text,
                html: html
            });
        },
        pickupConfirm: function (id) {
            var result = Rental.update( {_id: id}, { $set: {flag:"2"} });
            return result;
        },
        returnConfirm: function (id) {
            var checking_Status = getReturnConfirmCheck(id);
            if (checking_Status == 2) {
                var return_val = Rental.update( {_id: id}, { $set: {flag:"3"} });
            }
            else {
                return checking_Status;
            }
            return checking_Status;
        },      
        getServerTime: function () {
            return new Date();
        },
        getEnv: function () {
         return process.env.ROOT_URL;
        },
        getBuildDate: function () {
            return process.env.BUILD_DATE;
        },
        processStripePayment : function( token ) {
            STRIPE_SECRET_KEY = STRIPE_SECRET_KEY?STRIPE_SECRET_KEY:getPaymentSetting("secretKey").value.trim();
            var StripeServer = StripeAPI( STRIPE_SECRET_KEY );
            StripeServer.charges.create( {
                amount: 50,
                currency: 'USD',
                card: token },
                function(err, charge ) {
                    if (err) {
                        console.log(err.message);
                        return;
                    }
                    console.log("charge id", charge.id);
                }
            );
            console.log("stripe charge done");

        },
        getChargePrice: function (price) {
            return calculateChargePrice(price)/100;
        },
        chargingPayment : function (customerId, desc, price) {
            STRIPE_SECRET_KEY = STRIPE_SECRET_KEY?STRIPE_SECRET_KEY:getPaymentSetting("secretKey").value.trim();
            var StripeServer = StripeAPI( STRIPE_SECRET_KEY );
            var Future = Npm.require('fibers/future');
            var _this = this,
            fut = new Future();
            
                   /* real charge value including each fees */
            var chargeValue = calculateChargePrice(price);

            var striepCharge = StripeServer.charges.create( {
                amount: chargeValue,
                currency: 'USD',
                customer: customerId,
                description: desc
                },
                
                function(err, charge ) {
                    if (err){
                        fut['return'](err);
                    }
                    else{
                        fut['return'](charge);
                    }
                }
            );
            var result = fut.wait();
            return result;
        },
        createCustomer: function (token, userId) {
            STRIPE_SECRET_KEY = STRIPE_SECRET_KEY?STRIPE_SECRET_KEY:getPaymentSetting("secretKey").value.trim();
            var customer_id = "";
            var StripeServer = StripeAPI( STRIPE_SECRET_KEY );
            var Future = Npm.require('fibers/future');
            var _this = this,
            fut = new Future();
                   
            var stripeReturn = StripeServer.customers.create({
                card: token,
                email: "test@gmail.com"
                }, function(error, result) {
                if (error) console.error(error);
                else fut['return'](result);
            });
            
            var result = fut.wait();
            console.log(result.id);
            console.log(_this.userId);
            var id = Meteor.users.update(_this.userId, {$set: {"profile.customerId": result.id}});
            return id;
        },
        createBankaccount : function (bankName, routingNumber, accountNumber) {
            STRIPE_SECRET_KEY = STRIPE_SECRET_KEY?STRIPE_SECRET_KEY:getPaymentSetting("secretKey").value.trim();
            var StripeServer = StripeAPI(  STRIPE_SECRET_KEY );
            // console.log(StripeServer); return false;
            var Future = Npm.require('fibers/future');
            var _this = this,
            fut = new Future();
            var bankAccount = StripeServer.tokens.create({
                bank_account: {
                    country: 'US',
                    routing_number: "110000000",
                    account_number: "000123456789"
                }

            },function (error, result) {
                if (error) console.error(error);
                else fut['return'](result);
            });
            var result = fut.wait();
            var users = Meteor.users.find({_id: _this.userId}).fetch()[0];

            fut2  = new Future();
            var recipient = StripeServer.recipients.create({
                name: users.profile.fullname,
                type: "individual",
                email: users.emails.address,
                bank_account: result.id
            }, function (error, result) {
                if (error) {
                    console.error(error);
                }
                else {
                    fut2['return'](result);
                }
            });
            var result1 = fut2.wait();
            var id = Meteor.users.update(_this.userId, {$set: {"profile.recipientId": result1.id}});
            return id;

        },
        transferToLoanUser: function (id) {
            var rental = Rental.find({_id: id}).fetch()[0];
            var user_recipient = Meteor.users.find({_id: rental.loanuserId}).fetch()[0].profile.recipientId;
            var tool = Tools.find({_id: rental.toolId}).fetch()[0];
            var amount = rental.price * 100;
            STRIPE_SECRET_KEY = STRIPE_SECRET_KEY?STRIPE_SECRET_KEY:getPaymentSetting("secretKey").value.trim();
            var StripeServer = StripeAPI( STRIPE_SECRET_KEY );
            var Future = Npm.require('fibers/future');
            fut = new Future();
            amount = Math.round(amount);
            // console.log(user_recipient.profile.recipientId); return false;
            var transfer = StripeServer.transfers.create({
                amount: amount,
                currency: "usd",
                recipient: user_recipient,
                statement_descriptor: "payment for "+tool.toolname+" on toolshare service"
             }, function ( error, result) {
                if (error) {
                    console.log(error);
                }
                else {
                    fut['return'](result);
                }
             });
            var result = fut.wait();
            var id = Transfers.insert({transferId: result.id, date: result.date, amount: result.amount, recipientId: result.recipient, bankId: result.account.id});
            return id;
        },
        collectionMails : function (mail) {
            var check = MailData.find({address: mail}).fetch()[0];
            if (check ==  undefined) {
                MailData.insert({address: mail});   
            }
        },
        isAdminCheck: function() {
            return ( Meteor.user().username == "dennis_merrill" );
        }, 
        updateFeeback: function (rental_param, display) {
            Feedback.update({rentalId: rental_param}, {$set:{display:display}}, {multi: true});
        },
        declineApplicant: function (id) {
            var result = "";
            var Future = Npm.require('fibers/future');
            fut = new Future();            
            Rental.remove(id, function (error, result) {
                fut['return'](result);
            });
            var result = fut.wait();
            return result;
        },
        getFullUsername: function ( id ) {
            return Users.find({_id:id}).fetch()[0];
        },
        getToolData: function (id) {
            return Tools.find({_id: id}).fetch()[0];
        },
        getPickupInfo: function (id) {
            if (id) {
                var rental = Rental.find({_id:id}).fetch()[0];
                var hour = getHour(rental.pickupDate)["hour"];
                var year = parseFloat(rental.pickupDate.split(",")[2]);
                var month = parseFloat(rental.pickupDate.split(",")[0]);
                var date = parseFloat(rental.pickupDate.split(",")[1]);
                var min = getHour(rental.pickupDate)["min"];

                var pickupDate = new Date(year, month-1, date, hour, min, 0);
                return pickupDate;                
            }
        },
        setStipekey: function (key, value) {
            return Setting.upsert({key:key}, {$set: {value: value}});
        },
        setPaymentSetting : function (param) {
            Setting.upsert({key:"secretKey"}, {$set: {value: param.secretKey}});
            Setting.upsert({key:"publishableKey"}, {$set: {value: param.publishableKey}});
            Setting.upsert({key:"insuranceFee"}, {$set: {value: param.insuranceFee}});
            Setting.upsert({key:"transactionFee"}, {$set: {value: param.transactionFee}});
            return true;
        },
        getPublicStipeKey: function () {
            var publishableKey = Setting.find({key:"publishableKey"}).fetch()[0];
            publishableKey = publishableKey ? publishableKey.value: "";
            return publishableKey;
        },
        getServerMoment : function () {
            
        },
        createNewTool : function (obj) {
            obj.created = new Date();
            var id = Tools.insert(obj);
            return id;
        },
        setUserProfile : function (obj) {            
            return Meteor.users.update(Meteor.userId(), {$set: obj});
        },
        uploadFiles: function (file) {
            console.log(file);
            // console.log(file);
        }
    });
    function reminderAfterConfirmation() {
        var reasonable_rentals = getReminderPickup();
        for (var i = 0; i < reasonable_rentals.length; i ++ ) {
            // var rental_data = Rental.find({_id: reasonable_rentals[i]}).fetch()[0];
            var rent_user = Meteor.users.find({_id: reasonable_rentals[i].rentuserId}).fetch()[0];
            var loan_user = Meteor.users.find({_id: reasonable_rentals[i].loanuserId}).fetch()[0];
            var rent_tool = Tools.find({_id: reasonable_rentals[i].toolId}).fetch()[0];
             /* The Reminder Mail to Loan user. */
            var formatted_pickupDate = getForamattedDates(reasonable_rentals[i].pickupDate);               
            var html = "";
            html += "<div style='width: 600px;'>";
                html += "<p style='background:rgb(99, 96, 88);margin:0px;padding-left:60px;'>";
                    html += "<a href='#' style='font-family: Arial, sans-serif;font-size: 32pt;text-decoration:none;color:#FFFFFF'>EQWIP.IT</a>";
                html += "</p>";
     
                html += "<div style='background-color:rgb(156, 156, 156);width: 600px;padding-top: 20px;padding-bottom: 20px;'>";
                    html += "<p style='background:rgb(250, 250, 150);font-size:30px;width: 500px;margin: 0px auto 0px auto; text-align: center;'>REMINDER: "+rent_user.profile.fullname+" will be picking up "+rent_tool.toolname+" on "+formatted_pickupDate+"</p>";
                    html += "<div style='width: 500px;padding-top:20px;margin-left: auto; margin-right: auto;background: white; padding-bottom: 20px;'>";
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>Location: <a href='https://maps.google.com/?q="+rent_tool.fulladdress+"' style='text-decoration:none;'>"+rent_tool.fulladdress+"</a></p>";
                        html += "</div>";
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>Pickup Date: "+formatted_pickupDate+"</p>";
                        html += "</div>";                                   
                        html += "<div align='center' style='margin-top:20px;'>";
                        html += "<a href='#' style='padding: 5px; border-radius: 6px; color: white; text-decoration: none;background: red; font-size: 36px;text-align: center;background-image: -webkit-gradient(linear, left top, left bottom, from( rgb(0, 220, 0) /*{b-bup-background-start}*/), to( rgb(0, 140, 0) /*{b-bup-background-end}*/)); /* Saf4+, Chrome */background-image: -webkit-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Chrome 10+, Saf5.1+ */background-image:    -moz-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* FF3.6 */background-image:     -ms-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* IE10 */background-image:      -o-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Opera 11.10+ */background-image:linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/);'>Contact Renter</a>";
                        html += "</div>";
                    html += "</div>";
        
                html += "</div>";
            html += "</div>";
            var date = new Date();
            Email.send({
                to: loan_user.emails[0].address,
                from: 'dennis.e.merrill@gmail.com',
                subject: 'New Rental Confirmation from Eqwip.It',
                text: "",
                html: html
            });

            console.log("Reminder for pickup has been sent to loanuser: " + loan_user.emails[0].address);
            /* Reminder Mail to Rent User. */
            var html = "";
            html += "<div style='width: 600px;'>";
                html += "<p style='background:rgb(99, 96, 88);margin:0px;padding-left:60px;'>";
                    html += "<a href='#' style='font-family: Arial, sans-serif;font-size: 32pt;text-decoration:none;color:#FFFFFF'>EQWIP.IT</a>";
                html += "</p>";
                html += "<div style='background-color:rgb(156, 156, 156);width: 600px;padding-top: 20px;padding-bottom: 20px;'>";
                    html += "<p style='background:rgb(250, 250, 150);font-size:30px;width: 500px;margin: 0px auto 0px auto; text-align: center;'>REMINDER: You are scheduled to pick up "+rent_tool.toolname+" on "+formatted_pickupDate+"</p>";
                    html += "<div style='width: 500px;padding-top:20px;margin-left: auto; margin-right: auto;background: white; padding-bottom: 20px;'>";
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>Location: <a href='https://maps.google.com/?q="+rent_tool.fulladdress+"' style='text-decoration:none;'>"+rent_tool.fulladdress+"</a></p>";
                        html += "</div>";
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>Pickup Date: "+formatted_pickupDate+"</p>";
                        html += "</div>";                        
                        html += "<div align='center' style='margin-top:20px;'>";
                            html += "<a href='#' style='padding: 5px; border-radius: 6px; color: white; text-decoration: none;background: red; font-size: 36px;text-align: center;background-image: -webkit-gradient(linear, left top, left bottom, from( rgb(0, 220, 0) /*{b-bup-background-start}*/), to( rgb(0, 140, 0) /*{b-bup-background-end}*/)); /* Saf4+, Chrome */background-image: -webkit-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Chrome 10+, Saf5.1+ */background-image:    -moz-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* FF3.6 */background-image:     -ms-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* IE10 */background-image:      -o-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Opera 11.10+ */background-image:linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/);'>Contact Owner</a>";
                        html += "</div>";
                    html += "</div>";
                html += "</div>";
            html += "</div>";

            console.log("Reminder for pickup has been sent to rentuser: " + rent_user.emails[0].address);

            Email.send({
                to: rent_user.emails[0].address,
                from: 'dennis.e.merrill@gmail.com',
                subject: 'New Rental Confirmation from Eqwip.It',
                text: "",
                html: html
            });
        }
    }
    function reminderPickupConfirm() {
        var reasonable_rentals = getConfirmData();
        for (var i = 0; i < reasonable_rentals.length; i ++) {
            var rent_user = Meteor.users.find({_id: reasonable_rentals[i].rentuserId}).fetch()[0];
            var loan_user = Meteor.users.find({_id: reasonable_rentals[i].loanuserId}).fetch()[0];
            var rent_tool = Tools.find({_id: reasonable_rentals[i].toolId}).fetch()[0];
            var formatted_pickupDate = getForamattedDates(reasonable_rentals[i].pickupDate);
            var formatted_endDate = getForamattedDates(reasonable_rentals[i].endDate);
            var html = "";
            html += "<div style='width: 600px;'>";
                html += "<p style='background:rgb(99, 96, 88);margin:0px;padding-left:60px;'>";
                    html += "<a href='#' style='font-family: Arial, sans-serif;font-size: 32pt;text-decoration:none;color:#FFFFFF'>EQWIP.IT</a>";
                html += "</p>";
 
                html += "<div style='background-color:rgb(156, 156, 156);width: 600px;padding-top: 20px;padding-bottom: 20px;'>";
                    html += "<p style='background:rgb(250, 250, 150);font-size:30px;width: 500px;margin: 0px auto 0px auto; text-align: center;'>REMINDER: Did you pickup the Tool from "+loan_user.username+"?</p>";
                    html += "<div style='width: 500px;padding-top:20px;margin-left: auto; margin-right: auto;background: white; padding-bottom: 20px;'>";
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>  Tool Name: "+rent_tool.toolname+"</p>";
                        html += "</div>";
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>Pickup Date: "+formatted_pickupDate+"</p>";
                        html += "</div>";                           
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>   End Date: "+formatted_endDate+"</p>";
                        html += "</div>";                           
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>   Location: <a href='https://maps.google.com/?q="+rent_tool.fulladdress+"' style='text-decoration:none;'>"+rent_tool.fulladdress+"</a></p>";
                        html += "</div>";                                       
                        html += "<div align='center' style='margin-top:20px;'>";
                            // html += "<a href='"+process.env.ROOT_URL+"/pickupConfirm?rental="+reasonable_rentals[i]._id+"' style='padding: 5px; border-radius: 6px; color: white; text-decoration: none;background: red; font-size: 36px;text-align: center;background-image: -webkit-gradient(linear, left top, left bottom, from( rgb(0, 220, 0) /*{b-bup-background-start}*/), to( rgb(0, 140, 0) /*{b-bup-background-end}*/)); /* Saf4+, Chrome */background-image: -webkit-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Chrome 10+, Saf5.1+ */background-image:    -moz-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* FF3.6 */background-image:     -ms-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* IE10 */background-image:      -o-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Opera 11.10+ */background-image:linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/);'>Confirm to pickup "+rent_tool.tooldesc+"</a>";
                            html += "<a href='"+process.env.ROOT_URL+"/confirm/pickup/"+reasonable_rentals[i]._id+"' style='padding: 5px; border-radius: 6px; color: white; text-decoration: none;background: red; font-size: 36px;text-align: center;background-image: -webkit-gradient(linear, left top, left bottom, from( rgb(0, 220, 0) /*{b-bup-background-start}*/), to( rgb(0, 140, 0) /*{b-bup-background-end}*/)); /* Saf4+, Chrome */background-image: -webkit-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Chrome 10+, Saf5.1+ */background-image:    -moz-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* FF3.6 */background-image:     -ms-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* IE10 */background-image:      -o-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Opera 11.10+ */background-image:linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/);'>Confirm to pickup "+rent_tool.toolname+"</a>";
                        html += "</div>";
                    html += "</div>";
                html += "</div>";
            html += "</div>";
            Email.send({
                to: rent_user.emails[0].address,
                from: 'dennis.e.merrill@gmail.com',
                subject: 'Reminder pickup tool Confirmation from Eqwip.It',
                text: "",
                html: html
            });
            console.log("Reminder for pickup Confirm has been sent to rentuser: " + rent_user.emails[0].address);
         }
     // Test.insert({pickups: confirming_data});
    }
    function reminderReturnTool() {
        var reasonable_rentals = checkReturnTools();
        for (var i = 0; i < reasonable_rentals.length; i ++) {
            var rent_user = Meteor.users.find({_id: reasonable_rentals[i].rentuserId}).fetch()[0];
            var loan_user = Meteor.users.find({_id: reasonable_rentals[i].loanuserId}).fetch()[0];
            var rent_tool = Tools.find({_id: reasonable_rentals[i].toolId}).fetch()[0];
            var formatted_pickupDate = getForamattedDates(reasonable_rentals[i].pickupDate);
            var formatted_endDate = getForamattedDates(reasonable_rentals[i].endDate);
            var html = "";
            html += "<div style='width: 600px;'>";
                html += "<p style='background:rgb(99, 96, 88);margin:0px;padding-left:60px;'>";
                    html += "<a href='#' style='font-family: Arial, sans-serif;font-size: 32pt;text-decoration:none;color:#FFFFFF'>EQWIP.IT</a>";
                html += "</p>";
                html += "<div style='background-color:rgb(156, 156, 156);width: 600px;padding-top: 20px;padding-bottom: 20px;'>";
                    html += "<p style='background:rgb(250, 250, 150);font-size:30px;width: 500px;margin: 0px auto 0px auto; text-align: center;'>REMINDER: You should return Tool("+rent_tool.toolname+") to "+loan_user.profile.fullname+"</p>";
                    html += "<div style='width: 500px;padding-top:20px;margin-left: auto; margin-right: auto;background: white; padding-bottom: 20px;'>";
                        html += "<div style='margin-left: 40px;'>";
                        html += "<p style='font-weight: bold;margin:0px;'>Location: <a href='https://maps.google.com/?q="+rent_tool.fulladdress+"' style='text-decoration:none;'>"+rent_tool.fulladdress+"</a></p>";
                        html += "</div>";
                    // html += "<div align='center' style='margin-top:20px;'>";
                    //  html += "<a href='#' style='padding: 5px; border-radius: 6px; color: white; text-decoration: none;background: red; font-size: 36px;text-align: center;background-image: -webkit-gradient(linear, left top, left bottom, from( rgb(0, 220, 0) /*{b-bup-background-start}*/), to( rgb(0, 140, 0) /*{b-bup-background-end}*/)); /* Saf4+, Chrome */background-image: -webkit-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Chrome 10+, Saf5.1+ */background-image:    -moz-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* FF3.6 */background-image:     -ms-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* IE10 */background-image:      -o-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Opera 11.10+ */background-image:linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/);'>Contact Owner</a>";
                    // html += "</div>";
                html += "</div>";
            html += "</div>";
        html += "</div>";     
        Email.send({
            to: rent_user.emails[0].address,
            from: 'dennis.e.merrill@gmail.com',
            subject: 'Reminder return Tool Confirmation from Eqwip.It',
            text: "",
            html: html
        });
        console.log("Reminder for return tool has been sent to rentuser: " + rent_user.emails[0].address);
     }      
    }
    function reminderConfirmReturn (){
        var reasonable_rentals = confirmReturnTool();
       
        for (var i = 0; i < reasonable_rentals.length; i ++) {
            var rent_user = Meteor.users.find({_id: reasonable_rentals[i].rentuserId}).fetch()[0];
            var loan_user = Meteor.users.find({_id: reasonable_rentals[i].loanuserId}).fetch()[0];
            var rent_tool = Tools.find({_id: reasonable_rentals[i].toolId}).fetch()[0];
            var formatted_pickupDate = getForamattedDates(reasonable_rentals[i].pickupDate);
            var formatted_endDate = getForamattedDates(reasonable_rentals[i].endDate);
            
            var html = "";
            html += "<div style='width: 600px;'>";
                html += "<p style='background:rgb(99, 96, 88);margin:0px;padding-left:60px;'>";
                    html += "<a href='#' style='font-family: Arial, sans-serif;font-size: 32pt;text-decoration:none;color:#FFFFFF'>EQWIP.IT</a>";
                html += "</p>";
                html += "<div style='background-color:rgb(156, 156, 156);width: 600px;padding-top: 20px;padding-bottom: 20px;'>";
                    html += "<p style='background:rgb(250, 250, 150);font-size:30px;width: 500px;margin: 0px auto 0px auto; text-align: center;'>REMINDER: Can you confirm to returned your Tool("+rent_tool.toolname+") from "+rent_user.profile.fullname+" already?</p>";
                    html += "<div style='width: 500px;padding-top:20px;margin-left: auto; margin-right: auto;background: white; padding-bottom: 20px;'>";
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>  Tool Name: "+rent_tool.toolname+"</p>";
                        html += "</div>";
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>Pickup Date: "+formatted_pickupDate+"</p>";
                        html += "</div>";                           
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>   End Date: "+formatted_endDate+"</p>";
                        html += "</div>";                           
                        html += "<div style='margin-left: 40px;'>";
                            html += "<p style='font-weight: bold;margin:0px;'>   Location: <a href='https://maps.google.com/?q="+rent_tool.fulladdress+"' style='text-decoration:none;'>"+rent_tool.fulladdress+"</a></p>";
                        html += "</div>";                                       
                        html += "<div align='center' style='margin-top:20px;'>";
                            html += "<a href='"+process.env.ROOT_URL+"/confirm/return/"+reasonable_rentals[i]._id+"' style='padding: 5px; border-radius: 6px; color: white; text-decoration: none;background: red; font-size: 36px;text-align: center;background-image: -webkit-gradient(linear, left top, left bottom, from( rgb(0, 220, 0) /*{b-bup-background-start}*/), to( rgb(0, 140, 0) /*{b-bup-background-end}*/)); /* Saf4+, Chrome */background-image: -webkit-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Chrome 10+, Saf5.1+ */background-image:    -moz-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* FF3.6 */background-image:     -ms-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* IE10 */background-image:      -o-linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/); /* Opera 11.10+ */background-image:linear-gradient( rgb(0, 220, 0) /*{b-bup-background-start}*/, rgb(0, 140, 0) /*{b-bup-background-end}*/);'>“Click to Confirm Return</a>";
                        html += "</div>";
                    html += "</div>";
                html += "</div>";
            html += "</div>";


            Email.send({
                to: loan_user.emails[0].address,
                from: 'dennis.e.merrill@gmail.com',
                subject: 'Rental Return Confirmation from Eqwip.It',
                text: "",
                html: html
            });         
            console.log("Reminder for confirm return tool has been sent to loanuser: " + loan_user.emails[0].address);
        }       
    }
    function getReminderPickup() {
        var rental = Rental.find({}).fetch();
        var rentals = new Array;
        for (var  i = 0; i < rental.length; i ++) {
            var hour = getHour(rental[i].pickupDate)["hour"];
            var year = parseFloat(rental[i].pickupDate.split(",")[2]);
            var month = parseFloat(rental[i].pickupDate.split(",")[0]);
            var date = parseFloat(rental[i].pickupDate.split(",")[1]);
            var min = getHour(rental[i].pickupDate)["min"];
            var pickupDate = new Date(year, month-1, date, hour, min, 0, 0 );
            var currentDate = new Date();
            var diff = pickupDate - currentDate;
            if (diff > 0 && rental[i].flag == "1") {
                if (rental[i].pickupReminder == undefined) {
                    var reminderConfirm = setToSendReminder(rental[i]._id, "pickupReminder");
                    if (reminderConfirm == "1")
                        rentals.push(rental[i]);    
                }
            }
        }
        return rentals; 
    }

    function setToSendReminder (id, reminder) {
        var result = "";
        if (reminder == "pickupReminder") {
            result = Rental.update({_id: id}, {$set: { pickupReminder : "1"}});
        }       
        else if(reminder == "pickupConfirmReminder") {
            result = Rental.update({_id: id}, {$set: { pickupConfirmReminder : "1"}});
        }
        else if (reminder == "returnReminder") {
            result = Rental.update({_id: id}, {$set: { returnReminder : "1"}});
        }
        else if (reminder == "returnConfirmReminder") {
            result = Rental.update({_id: id}, {$set: { returnConfirmReminder : "1"}});   
        }
        return result;
    }
    function getConfirmData() {
        var rental = Rental.find({}).fetch();
        var rentals = new Array;
        for (var  i = 0; i < rental.length; i ++) {
            var hour = getHour(rental[i].pickupDate)["hour"];
            var year = parseFloat(rental[i].pickupDate.split(",")[2]);
            var month = parseFloat(rental[i].pickupDate.split(",")[0]);
            var date = parseFloat(rental[i].pickupDate.split(",")[1]);
            var min = getHour(rental[i].pickupDate)["min"];
            var pickupDate = new Date(year, month-1, date, hour, min, 0, 0 );
            var currentDate = new Date();
            // var diff = currentDate - pickupDate;

            if (currentDate > pickupDate && rental[i].flag == "1") {
                 if (rental[i].pickupConfirmReminder == undefined) {
                     var reminderConfirm = setToSendReminder(rental[i]._id, "pickupConfirmReminder");
                     if (reminderConfirm == "1")
                        rentals.push(rental[i]);
                 }
            }
            
            /* Processing for Refund cases */

            var endHour = getHour(rental[i].endDate)["hour"];
            var endYear = parseFloat(rental[i].endDate.split(",")[2]);
            var endMonth = parseFloat(rental[i].endDate.split(",")[0]);
            var endDay = parseFloat(rental[i].endDate.split(",")[1]);
            var endMin = getHour(rental[i].endDate)["min"];
            var endDate = new Date(endYear, endMonth-1, endDay, endHour, endMin, 0, 0);
            
            
            /* in case of current date is passed the tool rental end date though rent user didn't receive the tool from loan user */
            
            if (currentDate > endDate && rental[i].flag == "1") {
                var customerId = Meteor.users.find({_id: rental[i].rentuserId}).fetch()[0].profile.customerId;
                var loanUserName = Meteor.users.find({_id: rental[i].rentuserId}).fetch()[0].username;
                var price = rental[i].price;
                var toolname = Tools.find({_id: rental[i].toolId}).fetch()[0].toolname;
                STRIPE_SECRET_KEY = STRIPE_SECRET_KEY?STRIPE_SECRET_KEY:getPaymentSetting("secretKey").value.trim();
                var StripeServer = StripeAPI( STRIPE_SECRET_KEY );
                var Future = Npm.require('fibers/future');
                var _this = this,
                fut = new Future();
                var striepCharge = StripeServer.charges.create( {
                    amount: price*100,
                    currency: 'USD',
                    customer: customerId,
                    description: "We refund your money because the tool("+toolname+") you have applicated was not recevied to you from "+loanUserName+" for some other reason."
                },function(err, charge ) {
                    if (err){
                        console.error(err);
                    }
                    else{
                        console.log("Refund Success");
                        fut['return'](charge);
                    }
                  }
                );
                var result = fut.wait();
                
            }
        }
        return rentals;         
    }
    

    function checkReturnTools () {
        var rental = Rental.find({}).fetch();
        var rentals = new Array;
        for (var  i = 0; i < rental.length; i ++) {
            var hour = getHour(rental[i].endDate)["hour"];
            var year = parseFloat(rental[i].endDate.split(",")[2]);
            var month = parseFloat(rental[i].endDate.split(",")[0]);
            var date = parseFloat(rental[i].endDate.split(",")[1]);
            var min = getHour(rental[i].endDate)["min"];
        
            // var pickupDate = new Date(year, month-1, date, hour+1, min, 0, 0 )
            var reminderDate = new Date(year, month-1, date, hour-1, min, 0, 0 );
            var returnDate = new Date(year, month-1, date, hour, min, 0, 0 );
            var currentDate = new Date();

            if (currentDate > reminderDate && rental[i].flag == "2") {
                if (rental[i].returnReminder == undefined) {
                    var reminderConfirm = setToSendReminder(rental[i]._id, "returnReminder");
                    if (reminderConfirm == "1") {
                        rentals.push(rental[i]);
                    }
                }
            }
        }
        return rentals;
    }
    function confirmReturnTool() {
        var rental = Rental.find({}).fetch();
        var rentals = new Array;
        for (var  i = 0; i < rental.length; i ++) {
            var hour = getHour(rental[i].endDate)["hour"];
            var year = parseFloat(rental[i].endDate.split(",")[2]);
            var month = parseFloat(rental[i].endDate.split(",")[0]);
            var date = parseFloat(rental[i].endDate.split(",")[1]);
            var min = getHour(rental[i].endDate)["min"];
        
            var reminderDate = new Date(year, month-1, date, hour+1, min, 0, 0 )
            var currentDate = new Date();

            if (currentDate > reminderDate && rental[i].flag == "2") {
                if (rental[i].returnConfirmReminder == undefined) {
                    var reminderConfirm = setToSendReminder(rental[i]._id, "returnConfirmReminder");
                    if (reminderConfirm == "1") {
                        rentals.push(rental[i]);
                    }
                }
            }
        }
        return rentals; 
    }
    
    /* 
     * to get the math value of time and min from zone value
    */
    
    function getHour(date) {
        var time = new Array;
        var hours = date.split(" ")[1];
        hour = parseFloat(hours.split(":")[0]);
        var min = parseFloat(hours.split(":")[1]);
        // min = parseFloat(min.split(",")[0]);
        var zone = date.toString().search("PM");
        if (zone != -1) {
            hour = parseInt(hour + 12);
        }
        time["hour"] = hour;
        time["min"] = min;
        return time;
    }

    /* 
     * to get the Formatted Datetime string
    */

    function getForamattedDates(date) {
        var dates = date.split(" ")[0];
        var time = date.split(" ")[1];
        return dates.split(",")[2]+"/"+dates.split(",")[0]+"/"+dates.split(",")[1]+ " " + time.split(",")[0]+" "+ time.split(",")[1];
    }
    function getReturnConfirmCheck(id) {
        var rental = Rental.find({_id: id}).fetch()[0];
        return rental.flag;
    }

    function calculateChargePrice(price) {
        insurance_fee_percent = insurance_fee_percent?insurance_fee_percent:getPaymentSetting("insuranceFee").value.trim();
        transaction_fee_percent = transaction_fee_percent?transaction_fee_percent:getPaymentSetting("transactionFee").value.trim();
        var insurance_fee = (insurance_fee_percent/100) * price;
        var transaction_fee = (transaction_fee_percent / 100) * price;
        var chargeValue = Math.round((price + insurance_fee + transaction_fee) * 100);
        chargeValue = chargeValue > 50 ? chargeValue : 50;
        return chargeValue;
    }

    function getPaymentSetting(key) {
        return Setting.find({key:key}).fetch()[0];
    }
}
