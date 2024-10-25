# Contact Management System API

This API provides endpoints for managing user contacts with functionalities for registration, login, contact management, and password reset. The project is built with Next.js, with SQLite for database management, and includes authentication, data validation, and more.

---

## Table of Contents

- [Project Setup](#project-setup)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)

---

## Project Setup

1. **Clone the repository:**
    ```bash
    git clone https://github.com/ahtirhsA/contact-management-system.git
    ```
2. **Install dependencies:**
    ```bash
    cd contact-management-system
    npm install
    ```
3. **Configure Environment Variables:**  
    - Create a `.env` file with values for database connection, JWT secret, etc.

4. **Run the server:**
    ```bash
    npm run dev
    ```
5. **Access the API** at `http://localhost:3004`.

---

## API Endpoints

### Registration

- **Endpoint:** `POST /register`
- **Description:** Registers a new user with their email and password.

- **On Success:** 
  - **Status Code:** 201 Created
  - **Response:** `{"message": "User registered successfully! Please check your email for verification."}`

- **On Failure:**
  - **Status Code:** 400 Bad Request
  -**If validation fails:**`{message: "Validation error: <details>"}`
  - **If a User Exists** `{ message: 'User already exists!' }`


### Email Verification

- **Endpoint:** `GET /verify-email`
- **Description:** Verifies a user’s email using a token sent to their email address upon registration.

- **On Success:** 
  - **Status Code:** 201 Created
  - **Response:** "Email verified successfully! You can now log in."

- **On Failure:**
  - **Status Code:** 400 Bad Request
  -**If no token is provided.:**"Invalid verification link."
  - **If the token is invalid or expired.** "Invalid or expired token."



### Login

- **Endpoint:** `POST /login`
- **Description:** Authenticates a user using email and password.
- **On Success:** 
  - **Status Code:** 200 OK
  - **Response:** `{"token": "<jwt_token>" }`

- **On Failure:**
  - **Status Code:** 401 Unauthorized
  - **Response Example:** `{ "error": "Invalid Password" }`

  - **Status Code:** 404 Not Found
  - **Response Example:** `{ "error": "User does not exists" }`



### Password Reset

- **Endpoint:** `POST /forgot_password`
- **Description:** Initiates password reset by sending an OTP to the user’s email.
- **On Success:** 
  - **Status Code:** 200 OK
  - **Response:** `{ "message": "OTP sent successfully" }`

- **On Failure:**

  - **Status Code:** 401 Unauthorized
  - **Response Example:** "User has not verified their email address. Please verify your email before resetting the password."

  - **Status Code:** 404 Not Found
  - **Response Example:** "User does not exist"


### Registration

- **Endpoint:** `POST /reset-password`
- **Description:** Resets the user's password if a valid OTP is provided.

- **On Success:** 
  - **Status Code:** 201 Created
  - **Response:** ""Password Updated Successfully!!!"

- **On Failure:**
  - **Status Code:** 400 Bad Request
  -**If validation fails:**`{message: "Validation error: <details>"}`
  - **If the OTP is not cached** :"OTP has expired or is invalid!"
  - **If the OTP does not matched** :"Invalid OTP!"

  - **Status Code:** 404 Not Found
  - **Response Example:** "User does not exist"



### Contact Management

#### Create Contact
- **Endpoint:** `POST /new-contact`
-**Request Body:**:{
  "name": "Mic Tison",
  "email": "tison@example.com",
  "phone": "+11234567890",
  "address": "789 Maple Ave, Springfield, IL, 62701",
  "timezone": "America/Chicago"
}
- **Description:** Adds a new contact to the user's contact list.
- **On Success:** 
  - **Status Code:** 201 Created
  - **Response:** `{ "message": "Contact created successfully"}`

- **On Failure:**
  - **Status Code:** 400 Bad Request
  -**If validation fails:**`{message: "Validation error: <details>"}`
  -**SQL CONSTRAINT ERROR:**`{ message: 'A contact with this email or phone already exists.' }`

   - **Status Code:** 500 Server Error
   - **Response Example:**`{ message: 'Error adding contact', error: err.message }`


#### Get All Contacts
- **Endpoint:** `GET GET /contacts?timezone=America/New_York&startDate=2024-01-01&endDate=2024-12-31&sortBy=name&order=ASC`
- **Description:** Retrieves all contacts for the authenticated user.
- **On Success:** 
  - **Status Code:** 200 OK
  - **Response:** "List of contacts"

- **On Failure:**
  - **Status Code:** 404 Not Found
  -**If contact list is empty:**`{ message: 'No contacts found.'}`

  - **Status Code:** 500 Server Error
  - **Response Example:**`{ message: 'The error is ${e}' }`


#### Update Contact
- **Endpoint:** `PUT /update-contact/:id`
-**Request Body:**:{
  "name": "Michael",
  "email": "michealg@example.com",
  "phone": "+112345678876",
  "address": "789/5 Laxminagar, Springfield, IL, 62701",
  "timezone": "America/Chicago"
}
- **Description:** Updates an existing contact's details.
- **On Success:** 
  - **Status Code:** 200 OK
  - **Response:** `{ "message": "Contact updated successfully" }`
- **On Failure:**
  - **Status Code:** 404 Not Found
  - **Response Example:** `{ "error": "Contact does not exist" }`

   - **Status Code:** 401 Unauthorized
  - **If Logged In user want to update other user contact details:** `{message:'This Contact does not belongs to you!!!'}`


#### Delete Contact
- **Endpoint:** `PUT /delete-contact/:id`
- **Description:** Deletes a contact by ID.
- **On Success:** 
  - **Status Code:** 200 OK
  - **Response:** `{message:'Delete Status updated successfully!!!'}`

- **On Failure:**
   - **Status Code:** 404 Not Found
  - **Response Example:** `{ "error": "Contact does not exist" }`

   - **Status Code:** 401 Unauthorized
  - **If Logged In user want to delete other user contacts:** `{message:'This Contact does not belongs to you!!!'}`


### Batch Processing for Bulk Contacts Creation
- **Endpoint:** `POST /contacts/batch`
-**Request Body:**:{
  "contacts": [
    {
      "name": "Daniel Stewart",
      "email": "daniel.stewart@example.com",
      "phone": "+19876543210",
      "address": "123 Baker St, Metro City",
      "timezone": "America/Chicago"
    },
    {
      "name": "Elena Garcia",
      "email": "elena.garcia@example.com",
      "phone": "+447123456789",
      "address": "15 King Rd, Greenfield",
      "timezone": "Europe/Madrid"
    }
  ]
}
- **Description:** Adds array of new contacts to the user's contact list.
- **On Success:** 
  - **Status Code:** 201 Created
  - **Response:** `{"message": "Contacts added successfully"}`


- **On Failure:**
  - **Status Code:** 400 Bad Request
  -**If validation fails:**`{message: "Validation error: <details>"}`

   - **Status Code:** 500 Server Error
   - **Response Example:**`{"message": "Error inserting contacts","error": "<Database error details>"}`


### Batch Processing for Bulk Contacts Updation
- **Endpoint:** `PUT /contacts/batch`
-**Request Body:**:{
    "updContacts": [
        {
            "id": 7,
            "name": "Sophia Hughes",
            "email": "sophia.hughes@example.com",
            "phone": "+14155552765",
            "address": "123/K Elm St, Denver, CO 80202, USA",
            "timezone": "America/Denver"
        },
        {
            "id": 8,
            "name": "Benjamin Harris",
            "email": "benjamin.harris@example.com",
            "phone": "+13014444326",
            "address": "789/I Oak St, Atlanta, GA 30301, USA",
            "timezone": "America/New_York"
        }
    ]
}
- **Description:** Updates array of new contacts to the user's contact list.
- **On Success:** 
  - **Status Code:** 201 Created
  - **Response:** `{"message": "Contacts updated successfully"}`


- **On Failure:**
  - **Status Code:** 400 Bad Request
  -**If validation fails:**`{message: "Validation error: <details>"}`

   - **Status Code:** 500 Server Error
   - **Response Example:**`{"message": "Error inserting contacts","error": "<Database error details>"}`


---

## Testing

To test the API endpoints, you can use [Postman](https://www.postman.com/) or [curl](https://curl.se/). Each endpoint supports the following tests:

1. **Registration and Login** - Test user creation and authentication.
2. **Password Reset** - Verify that OTPs are sent correctly.
3. **Contact Management** - Ensure all CRUD operations work as expected.

---

## Screenshots

### Registration 
[https://res.cloudinary.com/djzenbn7g/image/upload/v1729859034/Screenshot_222_u3lqlg.png]


### Login
[https://res.cloudinary.com/djzenbn7g/image/upload/v1729858863/Screenshot_221_uhz8p1.png]

### CREATE NEW CONTACT 
[https://res.cloudinary.com/djzenbn7g/image/upload/v1729858713/Screenshot_220_aaqasg.png]

### UPDATE (POST /update-contact/:id)
[https://res.cloudinary.com/djzenbn7g/image/upload/v1729858547/Screenshot_219_qdzuef.png]

### DELETE (PUT /delete-contact/:id)
[https://res.cloudinary.com/djzenbn7g/image/upload/v1729858298/Screenshot_218_ctidpw.png]


### GET /contacts?timezone=America/New_York&startDate=2024-01-01&endDate=2024-12-31 sortBy=name&order=ASC
[https://res.cloudinary.com/djzenbn7g/image/upload/v1729858110/Screenshot_217_j0o72p.png]

### POST /contacts/batch
[https://res.cloudinary.com/djzenbn7g/image/upload/v1729857711/Screenshot_215_rcluxz.png]

### PUT /contacts/batch
[https://res.cloudinary.com/djzenbn7g/image/upload/v1729857549/Screenshot_216_ejrbtm.png]



Include additional screenshots as needed for each endpoint to visually represent the success and failure cases.

---

## Notes

- The project uses JWT for user authentication.
- Ensure that all required fields are filled, as validation errors will return `400` status codes with error messages.
- Each request to `/contacts` requires a valid JWT token for access.

---

## License

This project is licensed under the MIT License.
