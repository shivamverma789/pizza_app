const Order = require("../../../models/order");

function orderController() {
    return {
        index(req, res) {
            Order.find({ status: { $ne: "completed" } }, null, { sort: { "createdAt": -1 } })
                .populate("customerId", "-password")
                .exec() // Remove the callback here
                .then((orders) => {
                    if (req.xhr) {
                        return res.json(orders);
                    } else {
                        res.render("admin/orders",{user: req.user}); // Adjust the path as needed
                    }
                })
                .catch((err) => {
                    // Handle any errors
                    console.error(err);
                    res.status(500).send("Internal Server Error");
                });
        }
    };
}

module.exports = orderController;
