![image](https://github.com/user-attachments/assets/63a95702-77ff-40c3-978b-658e08f45996)  
![rmdemo](https://github.com/user-attachments/assets/4851a7f0-70a7-4590-84fb-cbaee84d5768)

QUICK START WITH DOCKER:
- Make sure the Keycloak instance, PostgreSQL database, and backend are running
- Build the image with `docker build -t resource-manager-frontend .` if necessary.
- Run the built image with `docker run --name dvloper-frontend --net=host --restart=unless-stopped -d -e VITE_ROOT_URL=https://localhost -e VITE_BACKEND_URL=http://localhost:3000/ -e VITE_KEYCLOAK_URL=http://localhost:8080/ -e VITE_KEYCLOAK_REALM="Resource Manager" -e VITE_KEYCLOAK_CLIENT=resource-manager-frontend resource-manager-frontend` replacing the environment variables as appropriate. If the realm name contains any spaces, it should be enclosed in quotes as in the example.
- The app can be accessed on the root URL specified in the run parameters.
- Warning: the frontend cannot run over HTTP due to a dependency of the Keycloak library not working over unsecured connections, so it must be reverse proxied over HTTPS with a valid certificate.

This repository contains the frontend of a resource manager.
- It is built in TypeScript with Vite, Tanstack Router, and React, and connects to a separate backend housed in the `resource-manager-backend` repository.
- To properly initialise, a .env file needs to be created containing the app's root URL, e.g. `VITE_ROOT_URL=https://192.168.1.134`, the backend's root URL, e.g. `VITE_BACKEND_URL=http://192.168.1.134:3000/`, and Keycloak's URL, realm name, and client name, e.g. `VITE_KEYCLOAK_URL=http://192.168.1.134:8080/`, `VITE_KEYCLOAK_REALM=resource-manager`, and `VITE_KEYCLOAK_CLIENT=resource-manager-frontend`
- This version of the frontend makes calls to backend endpoints prefixed with the `/v1/` version.
- Info of logged-in user is fetched upon initial log in and stored in the authStore hook.

Authentication is done via Keycloak and requires that a frontend client be created for it, with `Client authentication` set to `Off`, Valid Redirect URIs set to the frontend's address with a trailing asterisk, and Web Origins set to the frontend's address without a trailing asterisk or slash. The client is supposed to be in the same realm as the backend, and as such it uses the same roles and user database.

To start it in dev mode, run `vite --host`.  
To build it, run `tsc -b && vite build`.  
To run the last build, run `vite preview`.  
The previewed app can be accessed on `http://{host IP}:5173`.

For testing, run `npm test`. This will initiate an end-to-end integration test performed by Playwright that goes through all the CRUD operations of the app, plus registration, logging in and out, and admin actions. The results are then outputted to the `playwright-report` subdirectory of the root.

The repository comes with a `nginx.conf`, `entrypoint.sh`, and `dockerfile` for building a Docker image using Nginx to serve the static files and automatically replace the environment variables in the configuration and code with runtime environment variables.

Finally, this repository also contains a GitLab CI/CD manifest to incorporate this app as part of a self-updating Kubernetes cluster. For more information on this, see the `resource-manager-devops` repository.
