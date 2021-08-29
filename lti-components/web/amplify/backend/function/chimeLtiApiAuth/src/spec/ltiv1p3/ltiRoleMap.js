`use strict`

// refer to https://www.imsglobal.org/spec/lti/v1p3/#role-vocabularies
const SPEC = {
    // set to true in order to allow role names without namespaces. Even though not recommended it should still be supported in LTI v1.3
    SUPPORT_NAMESPACE_LESS_ROLE_NAMES: true,
    // all supported role namespace prefixes in alignment to LTI specification v1.3
    SUPPORTED_NAMESPACES: [
        `http://purl.imsglobal.org/vocab/lis/v2/person`,
        `http://purl.imsglobal.org/vocab/lis/v2/system/person`,
        `http://purl.imsglobal.org/vocab/lis/v2/institution/person`,
        `http://purl.imsglobal.org/vocab/lis/v2/membership`
    ],
    ROLES: [
        {
            name: `Administrator`, // role name alias
            levelOfPrivilege: 1, // level of privilege. lower values indicate higher privilege
            ltiRoleNames: [ // list of role names according to LTI role vocabulary
                `AccountAdmin`,
                `SysAdmin`,
                `Administrator`,
                `Administrator#Administrator`,
                `Administrator#Developer`,
                `Administrator#ExternalDeveloper`,
                `Administrator#ExternalSupport`,
                `Administrator#ExternalSystemAdministrator`,
                `Administrator#Support`,
                `Administrator#SystemAdministrator`
            ]
        },
        {
            name: `Moderator`,
            levelOfPrivilege: 2,
            ltiRoleNames: [
                `Creator`,
                `SysSupport`,
                `Faculty`,
                `Staff`,
                `Manager`,
                `Manager#AreaManager`,
                `Manager#CourseCoordinator`,
                `Manager#ExternalObserver`,
                `Manager#Manager`,
                `Manager#Observer`,
                `ContentDeveloper`,
                `ContentDeveloper#ContentDeveloper`,
                `ContentDeveloper#ContentExpert`,
                `ContentDeveloper#ExternalContentExpert`,
                `ContentDeveloper#Librarian`,
                `Instructor`,
                `Instructor#ExternalInstructor`,
                `Instructor#Grader`,
                `Instructor#GuestInstructor`,
                `Instructor#Lecturer`,
                `Instructor#PrimaryInstructor`,
                `Instructor#SecondaryInstructor`,
                `Instructor#TeachingAssistant`,
                `Instructor#TeachingAssistantGroup`,
                `Instructor#TeachingAssistantOffering`,
                `Instructor#TeachingAssistantSection`,
                `Instructor#TeachingAssistantSectionAssociation`,
                `Instructor#TeachingAssistantTemplate`,
                `Officer`,
                `Officer#Chair`,
                `Officer#Communications`,
                `Officer#Secretary`,
                `Officer#Treasurer`,
                `Officer#Vice-Chair`
            ]
        },
        {
            name: `User`,
            levelOfPrivilege: 3,
            ltiRoleNames: [
                `None`,
                `User`,
                `Guest`,
                `Other`,
                `Student`,
                `Alumni`,
                `Mentor`,
                `Observer`,
                `ProspectiveStudent`,
                `Member`,
                `Member#Member`,
                `Mentor`,
                `Mentor#Advisor`,
                `Mentor#Auditor`,
                `Mentor#ExternalAdvisor`,
                `Mentor#ExternalAuditor`,
                `Mentor#ExternalLearningFacilitator`,
                `Mentor#ExternalMentor`,
                `Mentor#ExternalReviewer`,
                `Mentor#ExternalTutor`,
                `Mentor#LearningFacilitator`,
                `Mentor#Mentor`,
                `Mentor#Reviewer`,
                `Mentor#Tutor`,
                `Learner`,
                `Learner#ExternalLearner`,
                `Learner#GuestLearner`,
                `Learner#Instructor`,
                `Learner#Learner`,
                `Learner#NonCreditLearner`
            ]
        }
    ]
};

const resolveRoles = (...ltiRoles) => {
    const unmatchedLtiRoles = [];
    // match LTI roles with supported namespace
    const qualifyingLtiRoles = ltiRoles.flat().filter((ltiRole) => {
        return 0 <= SPEC.SUPPORTED_NAMESPACES.findIndex((ns) => {
            const matched = ltiRole.startsWith(ns);
            if (!matched) {
                unmatchedLtiRoles.push(ltiRole);
            }
            return matched;
        });
    });
    const matchedRoles = SPEC.ROLES.filter((role) => {
        if (SPEC.SUPPORT_NAMESPACE_LESS_ROLE_NAMES) {
            // if namespace is accepted to be missing allow for exact role name matches 
            if (0 <= unmatchedLtiRoles.findIndex((ltiRoleName) => {
                const matched = role.ltiRoleNames.includes(ltiRoleName);
                /*if (matched) {
                    console.log(`Incoming LTI user role claim '${ltiRoleName}' successfully mapped to '${role.name}'.`);
                }*/
                return matched;
            })) {
                return true;
            }
        }
        return 0 <= qualifyingLtiRoles.findIndex((qualifyingRole) => {
            return 0 <= role.ltiRoleNames.findIndex((ltiRoleName) => {
                const matched = qualifyingRole.endsWith(ltiRoleName);
                /*if (matched) {
                    console.log(`Incoming LTI user role claim '${qualifyingRole}' successfully mapped to '${role.name}'.`);
                }*/
                return matched;
            });
        });
    });

    if (matchedRoles.length == 0) {
        console.warn(`Incoming LTI user role claims could not be mapped to any permission role.`)
    }

    return matchedRoles;
}

module.exports = {
    resolveToLeastPrivilegedRole: (...ltiRoles) => {
        return resolveRoles(...ltiRoles).sort((a, b) => a.levelOfPrivilege - b.levelOfPrivilege).pop();
    },
    resolveToMostPrivilegedRole: (...ltiRoles) => {
        return resolveRoles(...ltiRoles).sort((a, b) => a.levelOfPrivilege - b.levelOfPrivilege).shift();
    },
    resolveRoles : resolveRoles
}