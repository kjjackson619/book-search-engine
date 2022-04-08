const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('savedBooks')

                return userData;
            }
            throw new AuthenticationError('Not logged in');
        },

        savedBooks: async (parent, { username }) => {

            const params = username ? { username } : {}
            return Book.find(params).sort({ bookId: -1 });
        },

        Book: async (parent, { _id }) => {
            return Book.findOne({ _id });
        },

        users: async () => {
            return User.find()
                .select('-__v -password')
                .populate('savedBooks')
        },
        user: async (parent, { username }) => {
            return User.findOne({ username })
                .select('-__v -password')
                .populate('savedBooks')
        }
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const token = signToken(user);
            return { token, user };
        }
    }
};

module.exports = resolvers;