export const typeDefs = /* GraphQL */ `
  type Trainer {
    id: ID!
    name: String!
    email: String!
    region: String!
    avatar_url: String
    created_at: String
  }

  type Team {
    id: ID!
    trainer_id: Int!
    name: String!
    pokemon_ids: [Int!]!
    created_at: String
    trainer: Trainer
  }

  type AuthPayload {
    token: String!
    user: Trainer!
  }

  type Query {
    teams: [Team!]!
    team(id: ID!): Team
    trainers: [Trainer!]!
    me: Trainer
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    createTeam(name: String!, pokemon_ids: [Int!]!, trainer_id: Int): Team!
    deleteTeam(id: ID!): Boolean!
  }
`;
