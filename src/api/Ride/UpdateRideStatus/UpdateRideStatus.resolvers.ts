import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";
import {
  UpdateRideStatusMutationArgs,
  UpdateRideStatusResponse,
} from "../../../types/graph";
import User from "../../../entities/User";
import Ride from "../../../entities/Ride";
import Chat from "../../../entities/Chat";

const resolvers: Resolvers = {
  Mutation: {
    UpdateRideStatus: privateResolver(
      async (
        _,
        args: UpdateRideStatusMutationArgs,
        { req, pubSub }
      ): Promise<UpdateRideStatusResponse> => {
        const user: User = req.user;
        if (user.isDriving) {
          console.log("user :", user, args);
          try {
            let ride: Ride | undefined | void;
            if (args.status === "ACCEPTED") {
              ride = await Ride.findOne(
                {
                  id: args.rideId,
                  status: "REQUESTING",
                },
                { relations: ["passenger", "driver"] }
              ).catch((err) => {
                console.log(err);
              });
              if (ride) {
                ride.driver = user;
                user.isTaken = true;
                user.save().catch((err) => {
                  console.log(err);
                });
                const chat = await Chat.create({
                  driver: user,
                  passenger: ride.passenger,
                })
                  .save()
                  .catch((err) => {
                    console.log(err);
                  });
                ride.chat = chat as any;
                ride.save().catch((err) => {
                  console.log(err);
                });
              }
            } else {
              ride = await Ride.findOne(
                {
                  id: args.rideId,
                  driver: user,
                },
                { relations: ["passenger", "driver"] }
              ).catch((err) => {
                console.log(err);
              });
            }
            if (ride) {
              ride.status = args.status;
              ride.save().catch((err) => {
                console.log(err);
              });
              if (args.status === "FINISHED") {
                user.isTaken = false;
                await user.save().catch((err) => {
                  console.log(err);
                });
                const passenger: User = ride.passenger;
                passenger.isRiding = false;
                await passenger.save().catch((err) => {
                  console.log(err);
                });
              }
              pubSub.publish("rideUpdate", { RideStatusSubscription: ride });
              return {
                ok: true,
                error: null,
              };
            } else {
              return {
                ok: false,
                error: "Can't update ride",
              };
            }
          } catch (error) {
            return {
              ok: false,
              error: error.message,
            };
          }
        } else {
          return {
            ok: false,
            error: "You are not driving",
          };
        }
      }
    ),
  },
};

export default resolvers;
