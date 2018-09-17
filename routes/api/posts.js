const express = require("express");
const router = express.Router();
const monsoose = require("mongoose");
const passport = require("passport");

// Post model
const Post = require("../../models/Post");

// Profile model
const Profile = require("../../models/Profile");

// Validation
const validatePostInput = require("../../validation/post");

// @route   GET api/posts/test
// @desc    Tests posts route
// @access  Public
router.get("/test", (req, res) => res.json({ msg: "Posts works" }));

// @route   GET api/posts/:id
// @desc    Get post by id
// @access  Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: "No post found with that ID" })
    );
});

// @route   GET api/posts
// @desc    Get posts
// @access  Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: "No posts found" }));
});

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with error object
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => res.json(post));
  }
);

// @route   DELETE api/posts/:id
// @desc    Delete post
// @access  Private
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Check Id of owner post
    Post.findOneAndRemove({ _id: req.params.id, user: req.user.id })
      .then(post => {
        return !post
          ? res.status(401).json({ post: "post not found" })
          : res.status(200).json({ post: "post deleted" });
      })
      .catch(err =>
        res.status(404).json({ post: "It had a problem deleting the post" })
      );
  }
);

// @route   POST api/posts/like/:id
// @desc    Like post
// @access  Private
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        if (
          post.likes.filter(like => like.user.toString() === req.user.id)
            .length > 0
        ) {
          return res
            .status(400)
            .json({ alreadyliked: "User already liked this post" });
        } else {
          // Add user id to likes array
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => res.json(post));
        }
      })
      .catch(err => res.status(404).json({ postnotfound: "No posts found" }));
  }
);

// @route   POST api/posts/unlike/:id
// @desc    Unlike post
// @access  Private
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        const likeIndex = post.likes.findIndex(
          like => like.user.toString() === req.user.id
        );
        if (likeIndex === -1) {
          return res
            .status(400)
            .json({ notliked: "You have not yet liked this post" });
        } else {
          // Add user id to likes array
          post.likes.splice(likeIndex, 1);
          post.save().then(post => res.json(post));
        }
      })
      .catch(err => res.status(404).json({ postnotfound: "No posts found" }));
  }
);

// @route   POST api/posts/comment/:id
// @desc    Comment post
// @access  Private
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with error object
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        // Add to comments array
        post.comments.unshift(newComment);

        // Save
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete a comment from a post
// @access  Private
router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        const commentIndex = post.comments.findIndex(
          comment => comment._id.toString() === req.params.comment_id
        );

        if (commentIndex === -1) {
          return res
            .status(404)
            .json({ commentnotfound: "Comment with this ID does not exist" });
        } else {
          // Delete
          post.comments.splice(commentIndex, 1);
          // Save
          post.save().then(post => res.json(post));
        }
      })
      .catch(err => res.status(404).json({ commentnotfound: "No post found" }));
  }
);

module.exports = router;
