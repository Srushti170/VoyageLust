const Listing = require("../models/listing.js");
const axios = require("axios");


module.exports.index = async (req, res) => {
  const { q } = req.query;
  let allListing;

  if (q) {
    allListing = await Listing.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } }
      ]
    });
  } else {
    allListing = await Listing.find({});
  }

  res.render("./listing/index.ejs", { allListing, q });
};


module.exports.renderNewForm=(req, res) => {
  res.render("listing/new.ejs");
}

module.exports.showListing= (async (req,res)=>{
  let {id}=req.params;
  const listing =await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
  if(!listing){
    req.flash("error","Cannot find that listing!");
    return res.redirect("/listings");
  }
  console.log(listing);
  res.render("listing/show.ejs",{listing})
})

module.exports.createListing= (async (req, res, next) => {
    let url=req.file.path;
    let filename=req.file.filename;
    const newListing = new Listing(req.body.listing);

    //mapppppppppppppppppp
    // build full address for geocoding
const fullAddress = `${req.body.listing.location}, ${req.body.listing.country}`;
const geoResponse = await axios.get(
  "https://api.maptiler.com/geocoding/" +
    encodeURIComponent(fullAddress) +
    ".json",
  {
    params: {
      key: process.env.MAPTILER_API_KEY,
      limit: 1
    }
  }
);
let coordinates = [0, 0];

if (geoResponse.data.features.length > 0) {
  coordinates = geoResponse.data.features[0].geometry.coordinates;
}
newListing.geometry = {
  type: "Point",
  coordinates: coordinates
};

    newListing.owner=req.user._id;
    newListing.image={url,filename};
    await newListing.save();
    req.flash("success","Successfully created a new listing!")
    res.redirect("/listings");
  })

  module.exports.renderEditForm= (async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
      req.flash("error","Cannot find that listing!");
      return res.redirect("/listings");
    }
    let orignalImageUrl=listing.image.url;
    orignalImageUrl=orignalImageUrl.replace("/listings/edit.ejs","/upload")  
    //w_200,h_10

    res.render("listing/edit.ejs", { listing, orignalImageUrl });
  })

  module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  // keep your existing update logic
  let listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true }
  );


  const updatedListing = req.body.listing;

  const locationChanged =
    typeof updatedListing.location !== "undefined" ||
    typeof updatedListing.country !== "undefined";

  if (locationChanged) {
    const fullAddress = `${updatedListing.location}, ${updatedListing.country}`;

    const geoResponse = await axios.get(
      "https://api.maptiler.com/geocoding/" +
        encodeURIComponent(fullAddress) +
        ".json",
      {
        params: {
          key: process.env.MAPTILER_API_KEY,
          limit: 1
        }
      }
    );

    if (geoResponse.data.features.length > 0) {
      listing.geometry = {
        type: "Point",
        coordinates: geoResponse.data.features[0].geometry.coordinates
      };
    }
  }


  // image update (your existing logic)
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  await listing.save();

  res.redirect(`/listings/${id}`);
};



module.exports.deleteListing= (async(req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
   req.flash("success","Listing Deleted")
  res.redirect("/listings");
})


module.exports.toggleLike = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const isLiked = user.likes.includes(id);

  if (isLiked) {
    // unlike
    user.likes.pull(id);
  } else {
    // like
    user.likes.push(id);
  }

  await user.save();
  res.redirect("/listings");
};
