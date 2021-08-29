# Setup instructions (Canvas)

To complete setting up the LTI tool in your Canvas instance you will need to go through the [LTI tool setup instructions](README.md) to obtain the following information:

- **ltiToolAuthUri**: is the Url used by an LTI platform like Canvas to forward to the LTI plugin tool. It's the main entrance to the tool and should be used to set authentication and redirect urls in your LTI plugin configuration.
- **ltiToolLoginUri**: is the Url used by Canvas to allow for federated login.
- **ltiToolJwkUri**: is the Url used by Canvas to obtain an OpenId token that is used to verify signature of incoming client requests.

Read step 5 of the [LTI tool setup instructions](README.md) for further instructions.

## LTI plugin setup in Canvas

The tool needs to be set up once (by an Administrator) and can then be used by teachers.

**1.1 )** Log in to your Canvas instance as an administrator.

**1.2 )** From the left menu select **Admin** and choose **Site Admin**.

**1.3 )** Go to **Developers Keys** and add a new key by clicking on the **+ Developer Key** button. Choose **+ LTI Key** from the appearing dropdown menu.

**1.4 )** On the configuration page please enter the following information and then hit **Save**:

- **Key name**: choose a name for the key e.g. _"Virtual Classroom with Amazon Chime"_.

- **Title**: choose a name for the key e.g. _"Virtual Classroom with Amazon Chime"_.

- **Description**: enter any additional information e.g. _"Developer key for accessing Virtual classroom LTI tool"_

- **Target Link URI**: Enter the _ltiToolAuthUri_ which is provided in step 5 in the [LTI tool setup instructions](README.md).

- **OpenID Connect Initiation Url**: Enter the _ltiToolLoginUri_ which is provided in step 5 in the [LTI tool setup instructions](README.md).

- **JWK Method**: Select _Public JWK URL_

- **Public JWK URL**: Enter the _ltiToolJwkUri_ which is provided in step 5 in the [LTI tool setup instructions](README.md).

- **Redirect URI(s)**: Enter the _ltiToolAuthUri_ which in step 5 in the [LTI tool setup instructions](README.md).

Unfold _Additional Settings_ and set

- **Privacy Level**: Public (this will let Canvas forward basic user information like display name and email address to the LTI tool. For now this is a requirement in order to show teacher's and students names in Chime meetings)

**1.5 )** Return to the developer keys list and enable the newly created developer key by changing its state from OFF to **ON**.

**1.6 :** Now is the best time to return to step 8 in the [LTI tool setup instructions](README.md) in order to complete the setup by providing the requested information.

Please replace _{YOUR_CANVAS_HOST_URI}_ with the actual host address of your Canvas instance.

- **/chime/lti/{env}/ltiPlatformTokenUri**: update value to 'https://{YOUR_CANVAS_HOST_URI}/login/oauth2/token'
- **/chime/lti/{env}/ltiPlatformJwkUri**: update value to 'https://{YOUR_CANVAS_HOST_URI}/api/lti/security/jwks'
- **/chime/lti/{env}/ltiPlatformAuthRequestUri**: update value to 'https://{YOUR_CANVAS_HOST_URI}/api/lti/authorize_redirect'

More information on these Urls can be found in [Canvas LMS documentation](https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html)

**1.7 :** Now go to a course where you would like to enable the LTI tool to be available for teachers and faculity staff to add to their course offering.

**1.8 :** Enter the **Settings** from the course menu on the left and go to the **Apps** tab. Create a new App by clicking on the **+ App** button.

**1.9 :** From the dropdown please choose **by Client ID** as the _configuration type_ and enter the developer key that you obtained from the process of creating the developer key in step _1.6_. Next, confirm by clicking on the **Install** button.

### Plugin use (Teachers)

**2.1 )** In Canvas, go to a course where you would like to add the LTI tool link. Make sure an Administrator added the tool to this course as described in step 1.8 and 1.9.

**2.2 )** Make sure your are on your courses **Home** page. Choose to create a new item for a module within that course by clicking on the button with the **+** symbol. If there's no module in your course yet please create one.

**2.3 )** From the dropdown select to add an **External Tool**. Choose the tool that should have the same name as given to the developer key in step _1.4_. Optional but recommended, select **Load in a new tab** to open the LTI tool link in a new browser tab. Click **Add Item**.

**2.4 )** To make this link public please don't forget to publish the newly created item. It should now be seen with a green checkmark icon in the item list of a module.

Now you will see the LTI tool link in a module on your course page. If the LTI tool has been set up following all the steps in the [LTI tool setup instructions](README.md), clicking on this link will now bring you to the LTI tool website.
