import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { Team, CreateTeamInput } from '../models/team.model';
import { environment } from '../../../environments/environment';

interface TeamsQueryResponse {
  data?: {
    teams: Team[];
  };
  errors?: Array<{ message: string }>;
}

interface CreateTeamResponse {
  data?: {
    createTeam: Team;
  };
  errors?: Array<{ message: string }>;
}

interface DeleteTeamResponse {
  data?: {
    deleteTeam: boolean;
  };
  errors?: Array<{ message: string }>;
}

@Injectable({ providedIn: 'root' })
export class TeamGraphQLService {
  private readonly http = inject(HttpClient);

  /**
   * Fetches all teams from the backend GraphQL microservice.
   */
  getTeams$(): Observable<Team[]> {
    const query = `
      query GetTeams {
        teams {
          id
          trainer_id
          name
          pokemon_ids
          created_at
          trainer {
            id
            name
            region
            avatar_url
          }
        }
      }
    `;

    return this.http
      .post<TeamsQueryResponse>(environment.backendGraphqlUrl, { query })
      .pipe(
        map((response) => {
          if (response.errors && response.errors.length > 0) {
            throw new Error(response.errors[0].message || 'Failed to fetch teams');
          }
          return response.data?.teams || [];
        }),
      );
  }

  /**
   * Creates a new team with an optimistic backend call.
   *
   * @param input Team creation data
   */
  createTeam$(input: CreateTeamInput): Observable<Team> {
    const mutation = `
      mutation CreateTeam($name: String!, $pokemon_ids: [Int!]!, $trainer_id: Int) {
        createTeam(name: $name, pokemon_ids: $pokemon_ids, trainer_id: $trainer_id) {
          id
          trainer_id
          name
          pokemon_ids
          created_at
          trainer {
            id
            name
            region
            avatar_url
          }
        }
      }
    `;

    return this.http
      .post<CreateTeamResponse>(environment.backendGraphqlUrl, {
        query: mutation,
        variables: {
          name: input.name,
          pokemon_ids: input.pokemon_ids,
          trainer_id: input.trainer_id,
        },
      })
      .pipe(
        map((response) => {
          if (response.errors && response.errors.length > 0) {
            throw new Error(response.errors[0].message || 'Failed to create team');
          }
          if (!response.data?.createTeam) {
            throw new Error('Server returned empty team response');
          }
          return response.data.createTeam;
        }),
      );
  }

  /**
   * Deletes a team by ID.
   *
   * @param id Team ID
   */
  deleteTeam$(id: string): Observable<boolean> {
    const mutation = `
      mutation DeleteTeam($id: ID!) {
        deleteTeam(id: $id)
      }
    `;

    return this.http
      .post<DeleteTeamResponse>(environment.backendGraphqlUrl, {
        query: mutation,
        variables: { id },
      })
      .pipe(
        map((response) => {
          if (response.errors && response.errors.length > 0) {
            throw new Error(response.errors[0].message || 'Failed to delete team');
          }
          return response.data?.deleteTeam ?? false;
        }),
      );
  }
}
