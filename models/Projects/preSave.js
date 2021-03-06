var _ = require('lodash')

const saveContributor = require('./saveContributor')
const clearContributors = require('./clearContributors')

module.exports = function projectsPreSave (next) {
  const project = this

  // don't clear contributors if we don't have a new list to replace them with
  if (!project.members || !project.leads) return next()

  // if contributors exist in save call, this qualifies as last updated
  // otherwise it's saving activity, which is automatic
  project.lastUpdated = new Date()

  // remove any currently saved contributors, we have a new list
  clearContributors(project)
    .then(() => {
      const saveContributorsCalls = []
      project.members = _.without.apply(undefined, [project.members].concat(project.leads))
      if (project.leads && project.leads.length) {
        for (let leadIndex in project.leads) {
          const lead = project.leads[leadIndex]
          saveContributorsCalls.push(saveContributor('lead', project, lead))
        }
      }
      if (project.members && project.members.length) {
        for (let memberIndex in project.members) {
          const member = project.members[memberIndex]
          saveContributorsCalls.push(saveContributor('project', project, member))
        }
      }
      return Promise.all(saveContributorsCalls)
    })
    .then(function (results) {
      if (project.leads) delete project.leads
      if (project.members) delete project.members
      next()
    })
    .catch((err) => {
      console.error(err)
      next(err)
    })
}
