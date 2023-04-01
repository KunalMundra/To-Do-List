const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const date = require(__dirname + "/date.js")
const _ = require("lodash")

const items = ["To buy food", "To cook food", "To eat food"];
const workItems = [];
app.use(bodyparser.urlencoded({ extended: true }))
app.use(express.static("public"))
app.set('view engine', 'ejs');

mongoose.set('strictQuery', false);
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/todoList');
    console.log("Database connected!")
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const itemSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemSchema]
}

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);


const item1 = new Item({
    name: "Welcome to your todoList!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// Item.insertMany(defaultItems)

// .then(data =>{
//     console.log("Successfully saved defalut items to DB")
// })
// .catch(err => console.log(err));


app.get("/", function (req, res) {

    Item.find({})

        .then(foundItems => {
            // console.log(foundItems)
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems)

                    .then(data => {
                        // console.log("Successfully saved defalut items to DB")
                        res.render("list", { ListTitle: "Today", newlistitems: data });

                    })
                    .catch(err => console.log(err));

                // res.render("list", { ListTitle: "Today", newlistitems: defaultItems });
            }
            else {
                res.render("list", { ListTitle: "Today", newlistitems: foundItems });
            }
        })
        .catch(err => console.log(err));

});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save()
        res.redirect("/")
    }
    else {
        List.findOne({ name: listName })
            .then(foundList => {
                foundList.items.push(item)
                foundList.save();
                res.redirect("/" + listName)
            })
    }

})

app.post("/delete", function (req, res) {
    const checkeditemID = req.body.checkbox
    const listName = req.body.listName

    if (listName === "Today") {
        Item.findByIdAndRemove(checkeditemID)
            .then(data => {
                res.redirect("/")
            })
            .catch(err => {
                console.log(err)
            })
    }
    else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkeditemID } } })
            .then(foundItem => {
                res.redirect("/" + listName)

            })
    }
})

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName)

    List.findOne({ name: customListName })
        .then(foundList => {
            if (!foundList) {
                // console.log("Doesn't Exists")
                const list = new List({
                    name: customListName,
                    items: defaultItems
                })

                list.save();

                res.redirect("/" + customListName)
            }
            else {

                res.render("list", { ListTitle: foundList.name, newlistitems: foundList.items })
            }
        })
        .catch(err => {
            console.log(err)
        })


})

// app.get("/work", function (req, res) {
//     res.render("list", { ListTitle: "Work List", newlistitems: workItems })
// })

app.get("/about", function (req, res) {
    res.render("about")
})
app.listen(3000, function () {
    console.log("Server started on port 3000");
})