import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchemaSync } from "@graphql-tools/load";
import { PubSub } from "graphql-subscriptions";
import path from "path";
import chatRoomList from "./db/ChatRooms";
import { ChatRoom, Message, Resolvers } from "./__generated__/resolvers-types";

export const typeDefs = loadSchemaSync(
  path.join(__dirname, "./schema/", "*.graphql"),
  {
    loaders: [new GraphQLFileLoader()],
  }
);

const pubsub = new PubSub();

export const resolvers: Resolvers = {
  Subscription: {
    chatRoomCreated: {
      subscribe: () => {
        //TODO What's the type of asyncInterator?
        return pubsub.asyncIterator<ChatRoom>("CHAT_ROOM_CREATED") as any;
      },
    },
    messageCreated: {
      subscribe: () => {
        //TODO What's the type of asyncInterator?
        return pubsub.asyncIterator<Message>("NEW_MESSAGE") as any;
      },
    },
  },
  Query: {
    chatRoomList: () => chatRoomList,
  },
  Mutation: {
    createChatRoom: (_obj, args, _context, _info) => {
      const { title, description } = args.input;

      pubsub.publish("CHAT_ROOM_CREATED", {
        chatRoomCreated: {
          id: title,
          title,
          description,
          messages: [],
        },
      });

      return {
        id: title,
        title,
        description,
        messages: [],
      };
    },
    createMessage: (_obj, args, _context, _info) => {
      const { author, text } = args.input;
      const timestamp = Date.now().toString();

      pubsub.publish("NEW_MESSAGE", {
        messageCreated: {
          id: timestamp,
          author,
          text,
          timestamp: timestamp,
        },
      });

      return true;
    },
  },
};
