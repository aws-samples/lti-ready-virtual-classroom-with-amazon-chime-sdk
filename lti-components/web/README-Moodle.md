# Setup instructions (Moodle)

To complete setting up the LTI tool in your Moodle instance you will need to go through the [LTI tool setup instructions](README.md) to obtain the following information:

- **ltiToolAuthUri**: is the Url used by an LTI platform like Moodle to forward to the LTI plugin tool. It's the main entrance to the tool and should be used to set authentication and redirect urls in your LTI plugin configuration.
- **ltiToolLoginUri**: is the Url used by Moodle to allow for federated login.
- **ltiToolJwkUri**: is the Url used by Moodle to obtain an OpenId token that is used to verify signature of incoming client requests.

Read step 5 of the [LTI tool setup instructions](README.md) for further instructions.

## LTI plugin setup in Moodle

The tool needs to be set up once (by an Administrator) and can then be used by teachers.

**1.1 )** Log in to your Moodle instance as an administrator.

**1.2 )** From the left menu select **Site administration**.

**1.3 )** Navigate to the **Plugins** tab and click on the **Manage tools** under the **External tools** activity module.

**1.4 )** Next, click on **configure a tool manually**

**1.5 )** Enter the following information before clicking on **Save changes**

- **Tool name**: choose a name for this tool as it will appear for teachers who choose to add it to their course pages. For instance, _"Virtual Classroom with Amazon Chime"_.

- **Tool URL**: Enter the _ltiToolAuthUri_ which is provided in instruction step 5

- **Tool description**: Optional. Provide some details for what this tool does in order to help teachers understand the features of it.

- **LTI version**: Select _LTI 1.3_

- **Public key type**: Select _Keyset URL_

- **Public keyset**: Enter the _ltiToolJwkUri_ which is provided in step 5 of the [LTI tool setup instructions](README.md)

- **Initiate login URL**: Enter the _ltiToolLoginUri_ which is provided in step 5 of the [LTI tool setup instructions](README.md)

- **Redirection URI(s)**: Enter the _ltiToolAuthUri_ which is provided in step 5 of the [LTI tool setup instructions](README.md)

**1.6 )** Click on **Save changes**. In the _manage tools_ section the plugin should now be displayed as _active_.

**1.7 )** Click on the list icon of the listed tool that you just added to open its configuration details. In this window you can find all the information that is needed to update the plaform configuration as it is described in instruction step 8 of the [LTI tool setup instructions](README.md).

- **/chime/lti/{env}/ltiPlatformTokenUri**: update value to what is displayed as the 'Access token URL' in Moodle
- **/chime/lti/{env}/ltiPlatformJwkUri**: update value to what is displayed as the 'Public keyset URL' in Moodle
- **/chime/lti/{env}/ltiPlatformAuthRequestUri**: uupdate value to what is displayed as the 'Authentication request URL' in Moodle

## LTI plugin use in Moodle

Once the administrative setup is completed the plugin is available to teachers and faculty members with moderator permissions. They can now go ahead and add this plugin to their course pages.

**2.1 )** Navigate to a course page where you'd like to add the LTI tool link.

**2.2 )** Click on the **Turn editing on** button.

**2.3 )** Depending on where you'd like to add this LTI tool link on your page select the respective **Add an activity or resource** option of a listed section or topic.

**2.4 )** Select **External tool** and enter the following information:

- **Activity name**: Choose a name that will label the LTI tool link as it appears for students e.g. "Enter virtual classroom".

- **Preconfigured tool**: From the dropdown menu select the LTI tool. It appears with the name chosen by the Administrator during the plugin setup described above.

**2.5 )** Click on **Show more ...** and set **Launch container** to _New Window_. While this isn't required it's highly recommended. Instead of showing the LTI tool website in an Iframe having it open up in a new browser window improves usability in particular on smaller screens with lower resolutions.

**2.6 )** Click **Save and display** to add the LTI tool link to the page.

You should now see the LTI tool link on the course page. If the LTI tool has been set up following all the steps in the [LTI tool setup instructions](README.md), clicking on this link will now bring you to the LTI tool website.
