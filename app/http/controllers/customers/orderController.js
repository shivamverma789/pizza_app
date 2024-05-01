const Order = require("../../../models/order")
const moment = require("moment");

function orderController (){
    return {
        async index(req,res){
            const orders =await Order.find({ customerId: req.user._id},
                null,
                {sort: {createdAt:-1}})
                res.header('Cache-Control', 'no-store')
            res.render("customers/orders",{orders: orders, moment: moment,user: req.user});
        },
        async show(req,res){
            const order = await Order.findById(req.params.id);
            //autherize user
            if(req.user._id.toString() === order.customerId.toString()){
                return res.render("customers/singleOrder",{order:order,user:req.user})
            }
                return res.redirect("/");
        },

        store(req,res){
            //validate req  
            const {phone , address } =req.body
            

            if( !phone || !address){
                req.flash("error", "All field are required");
                return res.redirect ("/cart")
            }
            
            const order =new Order({
                customerId: req.user._id,
                items:req.session.cart.items,
                phone: phone ,
                address: address,
                
            })
            // console.log(order);

            order.save().then(result =>{
                Order.populate(result,{path: "customerId"})
                .then((placedOrder) => {
                    req.flash("success", "Order Placed Sucessfully")
                    delete req.session.cart
                    //Emit
                    const eventEmitter = req.app.get("eventEmitter");
                    eventEmitter.emit("orderPlaced", result);
                })
                .catch((err) => {
                    // Handle any errors
                    console.error(err);
                    res.status(500).send("Internal Server Error");
                });
                

                return res.redirect("/customer/orders")
            }).catch(err=>{
                req.flash("error", "Something went Wrong")
                return res.redirect("/cart")
            })
        }
    }
}
module.exports = orderController;