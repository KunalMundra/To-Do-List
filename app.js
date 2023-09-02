const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const date = require(__dirname + "/date.js");
const _ = require("lodash");

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.set("strictQuery", false);
main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb+srv://kunalmundra:Kunal123@cluster0.ptc5jmr.mongodb.net/TodoDB?retryWrites=true&w=majority");
  console.log("Database connected!");
}

const itemSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemSchema],
};

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const defaultItems = [];

app.get("/", function (req, res) {
  Item.find({})

    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)

          .then((data) => {
            res.render("list", { ListTitle: "Today", newlistitems: data });
          })
          .catch((err) => console.log(err));
      } else {
        res.render("list", { ListTitle: "Today", newlistitems: foundItems });
      }
    })
    .catch((err) => console.log(err));
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkeditemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkeditemID)
      .then((data) => {
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkeditemID } } }
    ).then((foundItem) => {
      res.redirect("/" + listName);
    });
  }
});

app.post("/create", (req, res) => {
  const listName = req.body.newList;
  res.redirect("/" + listName);
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();

        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          ListTitle: foundList.name,
          newlistitems: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/FindList", function (req, res) {
  const listName = _.capitalize(req.body.ListName);
  List.findOne({ name: listName })
    .then((foundList) => {
      if (!foundList) {
        console.log("List with this name does not exist!");
        res.redirect("/");
      }
      else {
        res.redirect("/" + listName);
      }
    })
    .catch((err) => {
      console.log(err);
    });
})

app.post("/DeleteList", function (req, res) {
  const listname = req.body.list;
  if (listname === "Today") {
    res.redirect("/");
  }
  else {
    List.deleteOne({ name: listname })
      .then((foundItem) => {
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  }
})

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
