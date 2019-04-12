# CS2102-Team-2
NUS CS2102 Team 2 Project

Ensure you are in the right directory. To know you are in the right directory, you should see the SQL file and the App folder.

# Setting up Database
Run the following commands to set up the database correctly
```
psql -U <postgres_role>
\c restaurant_app
\i schema.sql
\i mock_data_generation.sql
```
Note: File location are relative, so ensure you are at the right location.

# Run web server
Next, run the following set of commands relative from the home directory
```
cd App
npm install
node bin /www
```
