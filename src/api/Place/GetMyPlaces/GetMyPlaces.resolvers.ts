import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";
import { GetMyPlacesResponse } from "../../../types/graph";
import User from "../../../entities/User";

const resolvers: Resolvers = {
  Query: {
    GetMyPlaces: privateResolver(
      async (_, __, { req }): Promise<GetMyPlacesResponse> => {
        try {
          const user = await User.findOne(
            { id: req.user.id },
            { relations: ["places"] }
          );
          if (user) {
            const tempPlaces = user.places as any;
            const favPlaces: any = [];
            const notFavPlaces: any = [];
            tempPlaces.forEach((place) => {
              if (place.isFav) {
                favPlaces.push(place);
              } else {
                notFavPlaces.push(place);
              }
            });
            const sort = (a, b) => a.id - b.id;
            favPlaces.sort(sort);
            notFavPlaces.sort(sort);
            const places = favPlaces.concat(notFavPlaces);
            return {
              ok: true,
              places: places,
              error: null,
            };
          } else {
            return {
              ok: false,
              error: "user not found",
              places: null,
            };
          }
        } catch (error) {
          return {
            ok: false,
            error: error.message,
            places: null,
          };
        }
      }
    ),
  },
};

export default resolvers;
