"""
Plants GWAS service.
"""

__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '12/12/13'

## Imports

# Stdlib
import json
from string import Template
from operator import itemgetter
# Third party
# Service framework
from biokbase.narrative.common.service import init_service, method, finalize_service
# Other KBase
from biokbase.GWAS.Client import GWAS
from biokbase.narrative.common.util import AweJob, Workspace2
from biokbase.KBaseNetworksService2.Client import KBaseNetworks
from biokbase.cdmi.client import CDMI_API,CDMI_EntityAPI
from biokbase.IdMap.Client import IdMap
from biokbase.OntologyService.Client import Ontology
import sys
import os

## Exceptions


class GWASException(Exception):
    pass

## Globals

VERSION = (0, 0, 1)
NAME = "GWAS Services"

GENE_NETWORK_OBJECT_TYPE = "KBaseGwasData.GwasGeneList"


class URLS:
    #_host = '140.221.84.248'
    #main = "http://140.221.84.236:8000/node"
    #shock = "http://140.221.84.236:8000"
    awe = "http://140.221.85.182:7080"
    #awe = "https://kbase.us/services/awe-api/"
    #workspace = "https://kbase.us/services/ws/"
    ids = "http://kbase.us/services/idserver"
    cdmi = "http://kbase.us/services/cdmi_api"
    #cdmi = "http://140.221.85.181:7032"
    ontology = "http://kbase.us/services/ontology_service"
    gwas = "http://140.221.85.182:7086"
    #gwas = "https://kbase.us/services/GWAS"
    gwas1 = "http://140.221.85.95:7086"
    ujs = "https://kbase.us/services/userandjobstate"
    #networks = "http://kbase.us/services/networks"
    networks = "http://140.221.85.172:7064/KBaseNetworksRPC/networks"
    idmap = "http://kbase.us/services/id_map"
    #idmap = "http://140.221.85.181:7111"

AweJob.URL = URLS.awe

# Initialize
init_service(name=NAME, desc="Plants GWAS service", version=VERSION)


def _output_object(name):
    """Format an object ID as JSON output, for returning from a narr. function.
    """
    return json.dumps({'output': name})


def _workspace_output(wsid):
    return json.dumps({'values': [["Workspace object", wsid]]})



def ids2cds(ql):
    cdmic = CDMI_API(URLS.cdmi)
    idm = IdMap(URLS.idmap)

    gl = set()
    rd = {}
    eids = []
    lids = set()
    mids = set()
    for gid in ql:
      rd[gid] = gid
      if 'kb|g.' in gid:
        if 'locus' in gid:
          lids.add(gid)
        elif 'mRNA' in gid:
          mids.add(gid)
      else:
        eids.append(gid)

    sid2fids = cdmic.source_ids_to_fids(eids)
    for sid in sid2fids:
      for fid in sid2fids[sid]:
        rd[sid] = fid
        if 'locus' in fid:
          lids.add(fid)
        elif 'mRNA' in fid:
          mids.add(fid)
    lidmap = ()
    if len(lids) > 0: lidmap = idm.longest_cds_from_locus(list(lids))
    for lid in lidmap:
      for k in lidmap[lid]:
        gl.add(k)
    midl = list(mids)
    midmap = ()
    if len(mids) > 0: lidmap = idm.longest_cds_from_mrna(list(mids))
    for lid in midmap:
      for k in midmap[lid]:
        gl.add(k)

    for gid in ql:
      if 'kb|g.' in gid:
        if 'locus' in gid:
          for k in lidmap[gid]:
            rd[gid] = k
        elif 'mRNA' in gid:
          for k in midmap[gid]:
            rd[gid] = k
      else:
        if 'locus' in rd[gid]:
            for k in lidmap[rd[gid]]:
              rd[gid] = k
        elif 'mRNA' in rd[gid]:
            for k in midmap[rd[gid]]:
              rd[gid] = k
    return rd

def cds2locus(gids):
    cdmie = CDMI_EntityAPI(URLS.cdmi)
    mrnas_l = cdmie.get_relationship_IsEncompassedIn(gids, [], ['to_link'], [])
    mrnas = dict((i[1]['from_link'], i[1]['to_link']) for i in mrnas_l)
    locus_l = cdmie.get_relationship_IsEncompassedIn(mrnas.values(), [], ['to_link'], [])
    locus = dict((i[1]['from_link'], i[1]['to_link']) for i in locus_l)
    lgids = dict((i,locus[mrnas[i]]) for i in gids if i in mrnas and mrnas[i] in locus)
    return lgids
    
    
@method(name="Prepare Variation data for GWAS")
def maf(meth, maf=0.05, variation=None, out=None, comment=None):
    """Perform filtering on Minor allele frequency (MAF).
    Minor allele frequency (MAF) refers to the frequency at which the least common
    <a href="http://en.wikipedia.org/wiki/Allele">allele</a> occurs in a given population.

    :param maf: Minor allele frequency
    :type maf: kbtypes.Numeric
    :param variation: Population variation object
    :type variation: kbtypes.KBaseGwasData.GwasPopulationVariation
    :param out: Population variation, filtered 
    :type out: kbtypes.KBaseGwasData.GwasPopulationVariation
    :param comment: Comment
    :type comment: kbtypes.Unicode
    :return: Workspace ID of filtered data
    :rtype: kbtypes.Unicode
    :output_widget: ValueListWidget
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    argsx = {"ws_id" : meth.workspace_id, "inobj_id" : variation, "outobj_id" : out, "minor_allele_frequency" : maf, "comment" : "comment"}
    meth.advance("submit job to filter VCF")
    try:
        jid = gc.prepare_variation(argsx)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    AweJob.URL = URLS.awe
    AweJob(meth, started="run VCF", running="VCF").run(jid[0])
    return _workspace_output(out)


@method(name="Calculate Kinship matrix")
def gwas_run_kinship(meth,  filtered_variation=None, out=None, comment=None):
    """Computes the n by n kinship matrix for a set of n related subjects.
       The kinship matrix defines pairwise genetic relatedness among individuals and
       is estimated by using all genotyped markers. This requires the filtered SNPs as input.

    :param filtered_variation: Population variation, filtered
    :type filtered_variation: kbtypes.KBaseGwasData.GwasPopulationVariation
    :param out: Computed Kinship matrix
    :type out: kbtypes.KBaseGwasData.GwasPopulationKinship
    :param comment: Comment
    :type comment: kbtypes.Unicode
    :return: New workspace object
    :rtype: kbtypes.Unicode
    :output_widget: ValueListWidget
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    argsx = {"ws_id" : meth.workspace_id, "inobj_id" : filtered_variation, "outobj_id" : out,  "comment" : "comment"}
    meth.advance("submit job to select_random_snps")
    try:
        jid = gc.calculate_kinship_matrix(argsx)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    AweJob.URL = URLS.awe
    AweJob(meth, started="Calculate Kinship matrix", running="Kinship matrix").run(jid[0])
    return _workspace_output(out)


@method(name="Run GWAS analysis")
def gwas_run_gwas2(meth,  genotype=None,  kinship_matrix=None, traits=None,  out=None):
    """Computes association between each SNP and a trait of interest that has been scored
    across a large number of individuals. This method takes Filtered SNP object,
    kinship matrix, trait object as input and computes association.

   :param genotype: Population variation object
   :type genotype: kbtypes.KBaseGwasData.GwasPopulationVariation
   :param kinship_matrix: Kinship matrix object id
   :type kinship_matrix: kbtypes.KBaseGwasData.GwasPopulationKinship
   :param traits: Trait object id
   :type traits: kbtypes.KBaseGwasData.GwasPopulationTrait
   :param out: Output
   :type out: kbtypes.KBaseGwasData.GwasTopVariations
   :return: New workspace object
   :rtype: kbtypes.Unicode
    :output_widget: ValueListWidget
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    argsx = {"ws_id" : meth.workspace_id, "variation_id" : genotype, "trait_id" : traits,  "kinship_id": kinship_matrix, "out_id" : out, "comment" : "comment"}
    meth.advance("submit job to run GWAS analysis")
    try:
        jid = gc.run_gwas(argsx)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    AweJob.URL = URLS.awe
    AweJob(meth, started="GWAS analysis using emma", running="GWAS analysis using emma").run(jid[0])
    return _workspace_output(out)


@method(name="Trait Manhattan Plot")
def trait_manhattan_plot(meth, workspaceID=None, gwas_result=None):
    """Widget to visualize top SNPs related to a trait on the manhattan plot.
    On the X-axis of the plot are all contigs, and
    on the Y-axis is -log10(pvalue) of SNPs-association for the trait.

    :param workspaceID: workspaceID (use current if empty)
    :type workspaceID: kbtypes.Unicode
    :param gwas_result: GWAS analysis (MLM) result
    :type gwas_result: kbtypes.KBaseGwasData.GwasTopVariations
    :return: Workspace objectID of gwas results
    :rtype: kbtypes.Unicode
    :output_widget: Manhattan
    """
    meth.stages = 1
    if not workspaceID:
        workspaceID = meth.workspace_id
    meth.advance("Manhattan plot")
    token = meth.token
    return json.dumps({'token': token, 'workspaceID': workspaceID, 'gwasObjectID': gwas_result})


@method(name="GWAS Variation To Genes")
def gwas_variation_to_genes(meth, workspaceID=None, gwasObjectID=None, num2snps=None, pmin=None, distance=None, out=None):
    """This method takes the top SNPs obtained after GWAS analysis as input
    (TopVariations) object, -log (pvalue) cutoff and a distance parameter as input.
    For each significant SNP that passes the p-value cutoff, genes are searched in the
    window specified by the distance parameter.

    :param workspaceID: Workspace (use current if empty)
    :type workspaceID: kbtypes.Unicode
    :param gwasObjectID: GWAS analysis MLM result object
    :type gwasObjectID: kbtypes.KBaseGwasData.GwasTopVariations
    :param num2snps: Number to snps
    :type num2snps: kbtypes.Numeric
    :default num2snps: 100
    :param pmin: Minimum pvalue (-log10)
    :type pmin: kbtypes.Numeric
    :default pmin: 4
    :param distance: Distance in bp around SNP to look for genes
    :type distance: kbtypes.Numeric
    :default distance: 10000
    :param out: Output
    :type out: kbtypes.KBaseGwasData.GwasGeneList
    :return: Workspace objectID of gwas results
    :rtype: kbtypes.Unicode
    :output_widget: ValueListWidget
    """
    meth.stages = 3

    if not workspaceID:
        workspaceID = meth.workspace_id

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)
    meth.advance("Running Variations to Genes")
    argsx = {"ws_id" : meth.workspace_id, "variation_id" : gwasObjectID,  "out_id": out, "num2snps" : num2snps, "pmin": pmin, "distance" : distance, "comment" : "comment"}
    try:
        gl_oid = gc.variations_to_genes(argsx)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    #if not gl_oid: # it may return empty string based on current script
    #    raise GWASException(2, "submit job failed, no job id")

    meth.advance("Returning object")
    #return _workspace_output("Genelist.{}-{}".format(gwasObjectID, pmin))
    return _workspace_output(out)


GENE_TABLE_OBJECT_TYPE = "KBaseGwasData.GwasGeneList"


@method(name="Gene table")
def gene_table(meth, obj_id=None):
    """This method displays a gene list
    along with functional annotation in a table.

    :param obj_id: Gene List workspace object identifier.
    :type obj_id: kbtypes.KBaseGwasData.GwasGeneList
    :return: Rows for display
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
    # :param workspace_id: Workspace name (if empty, defaults to current workspace)
    # :type workspace_id: kbtypes.Unicode
    meth.stages = 1
    meth.advance("Retrieve genes from workspace")
    # if not workspace_id:
    #     meth.debug("Workspace ID is empty, setting to current ({})".format(meth.workspace_id))
    #     workspace_id = meth.workspace_id
    ws = Workspace2(token=meth.token, wsid=meth.workspace_id)
    raw_data = ws.get(obj_id)
    genes = raw_data['genes']
    header = ["KBase Chromosome ID", "Source gene ID", "KBase Gene ID", "Gene function", "Source Chromosome ID"]
    data = {'table': [header] + genes}
    return json.dumps(data)

@method(name="GeneList to Networks")
def gene_network2ws(meth, obj_id=None, out_id=None):
    """This method displays a gene list
    along with functional annotation in a table.

    :param obj_id: Gene List workspace object identifier.
    :type obj_id: kbtypes.KBaseGwasData.GwasGeneList
    :param out_id: Output Networks object identifier
    :type out_id: kbtypes.KBaseNetworks.Network
    :return: New workspace object
    :rtype: kbtypes.Unicode
    :output_widget: ValueListWidget
    """
    # :param workspace_id: Workspace name (if empty, defaults to current workspace)
    # :type workspace_id: kbtypes.Unicode
    meth.stages = 3
    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("Retrieve genes from workspace")
    # if not workspace_id:
    #     meth.debug("Workspace ID is empty, setting to current ({})".format(meth.workspace_id))
    #     workspace_id = meth.workspace_id
    ws = Workspace2(token=meth.token, wsid=meth.workspace_id)

    raw_data = ws.get(obj_id)
    

    gl = [ gr[2] for gr in raw_data['genes']]
    gl_str = ",".join(gl);

    meth.advance("Running GeneList to Networks")
    argsx = {"ws_id" : meth.workspace_id, "inobj_id" : gl_str,  "outobj_id": out_id}
    try:
        gl_oid = gc.genelist_to_networks(argsx)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    #if not gl_oid: # it may return empty string based on current script
    #    raise GWASException(2, "submit job failed, no job id")

    meth.advance("Returning object")
    return _workspace_output(out_id)

      
@method(name="User genelist to FeatureSet")
def genelist_to_featureset(meth, gene_ids=None, out_id=None):
    """This method converts user gene list to FeatureSet typed object.

    :param gene_ids: List of genes (comma separated)
    :type gene_ids: kbtypes.Unicode
    :param out_id: Output FeatureSet object identifier
    :type out_id: kbtypes.KBaseSearch.FeatureSet
    :return: New workspace object
    :rtype: kbtypes.Unicode
    :output_widget: ValueListWidget
    """
    meth.stages = 2
    meth.advance("Retrieve genes from Central Store")
    ws = Workspace2(token=meth.token, wsid=meth.workspace_id)
    
    gene_ids_ns = gene_ids.replace(" ","")
    qid2cds = ids2cds(gene_ids_ns.split(','))
    fs = {"description" : "User generated feature set by " + gene_ids, 
          "elements" : {}
         }
    cdmie = CDMI_EntityAPI(URLS.cdmi)
    cdmic = CDMI_API(URLS.cdmi)
    cds_ids = qid2cds.values()
    cds2l = cds2locus(cds_ids);
    lfunc = cdmic.fids_to_functions(cds2l.values())
    
    fm = cdmie.get_entity_Feature(cds_ids,['feature_type', 'source_id', 'sequence_length', 'function', 'alias'])
    for i in cds_ids: 
      if i in fm:
        if not fm[i]['function'] and cds2l[i] in lfunc:
          fm[i]['function'] = lfunc[cds2l[i]]
        fs['elements'][i] = {"data" : { 'type' : fm[i]['feature_type'], 'id' : i, 'dna_sequence_length' : int(fm[i]['sequence_length']), 'function' : fm[i]['function'], 'aliases' : fm[i]['alias']}}

    ws.save_objects({'workspace' : meth.workspace_id, 'objects' :[{'type' : 'KBaseSearch.FeatureSet', 'data' : fs, 'name' : out_id, 'meta' : {'original' : gene_ids}}]})

    meth.advance("Returning object")
    #return _workspace_output(out_id)
    return json.dumps({'values': [
                                   ["Workspace object", out_id],
                                   ["CDS IDs", ",".join(qid2cds.values())],
                                   ["User IDs", ",".join(qid2cds.keys())]
                                 ]})

# TODO: Don't forget to check gene function is there or not
@method(name="FeatureSet GO Analysis")
def featureset_go_anal(meth, feature_set_id=None, p_value=0.05, ec='IEA', domain='biological_process', out_id=None):
    """This method annotate GO terms and execute GO enrichment test 

    :param feature_set_id: FeatureSet workspace object id
    :type feature_set_id: kbtypes.KBaseSearch.FeatureSet
    :param p_value: p-value cutoff
    :type p_value: kbtypes.Unicode
    :param ec: Evidence code list (comma separated, IEA, ...)
    :type ec:kbtypes.Unicode
    :param domain: Domain list (comma separated, biological_process, ...)
    :type domain: kbtypes.Unicode
    :param out_id: Output FeatureSet object identifier
    :type out_id: kbtypes.KBaseSearch.FeatureSet
    :return: New workspace object
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
    # :param workspace_id: Workspace name (if empty, defaults to current workspace)
    # :type workspace_id: kbtypes.Unicode
    meth.stages = 3
    meth.advance("Prepare Enrichment Test")

    oc = Ontology(url=URLS.ontology)
    ws = Workspace2(token=meth.token, wsid=meth.workspace_id)
    fs = ws.get(feature_set_id)
    qid2cds = ids2cds(fs['elements'].keys())
    
    meth.advance("Execute Enrichment Test")
    ec = ec.replace(" ","")
    domain = domain.replace(" ","")
    ec_list = [ i for i in ec.split(',')]
    domain_list = [ i for i in domain.split(',')]
    ots = oc.get_goidlist(list(set(qid2cds.values())), domain_list, ec_list)
    enr_list = oc.get_go_enrichment(list(set(qid2cds.values())), domain_list, ec_list, 'hypergeometric', 'GO')
    enr_list = sorted(enr_list, key=itemgetter('pvalue'), reverse=False)
    header = ["GO ID", "Description", "Domain", "p-value"]
    fields = []
    go_enr_smry = ""
    for i in range(len(enr_list)):
      goen = enr_list[i]
      if goen['pvalue'] > float(p_value) : continue
      fields.append([goen['goID'], goen['goDesc'][0], goen['goDesc'][1], "{:6.4f}".format(goen['pvalue']) ])
      #fs['fse.'+goen['goID']+".desc" ] = goen['goDesc'][0]
      #fs['fse.'+goen['goID']+".domain" ] = goen['goDesc'][1]
      #fs['fse.'+goen['goID']+".p_value" ] = `goen['pvalue']`
      if i < 3 :
        go_enr_smry += goen['goID']+"(" + "{:6.4f}".format(goen['pvalue']) + ")" + goen['goDesc'][0] + "\n"
        #go_enr_anns[i] = goen['goID']+"(" + "{:6.4f}".format(goen['pvalue']) + ")" + goen['goDesc'][0]
    go_enr_smry
    data = {'table': [header] + fields}
    
    meth.advance("Annotate GO Term")
    go_key = lambda go, i, ext: "go.{}.{:d}.{}".format(go, i, ext)
    for gid in fs['elements']:
      if 'metadata' not in fs['elements'][gid]: fs['elements'][gid]['metadata'] = {}
      lid = qid2cds[gid]
      if lid in ots:
          go_enr_list = []
          for lcnt, go in enumerate(ots[lid].keys()):
              #if lcnt < 0:
                  #fs['elements'][gid]['data']['annotations'].append(go + "(go)" + ots[lid][go][0]['desc'] + '\n')
              for i, goen in enumerate(ots[lid][go]):
                  for ext in "domain", "ec", "desc":
                      fs['elements'][gid]['metadata'][go_key(go, i, ext)] = goen[ext]
                      fs['elements'][gid]['metadata'][go_key(go, i, ext)] = goen[ext]
      
    meth.advance("Saving output to Workspace")

    ws.save_objects({'workspace' : meth.workspace_id, 'objects' :[{'type' : 'KBaseSearch.FeatureSet', 'data' : fs, 'name' : out_id, 'meta' : {'original' : feature_set_id, 'enr_summary' : go_enr_smry}}]})


    meth.advance("Returning object")
    return json.dumps(data)
    #return json.dumps({'values': [
    #                               ["Workspace object", out_id],
    #                               ["Enrichment Summary", go_enr_smry]
    #                             ]})


@method(name="FeatureSet to Networks")
def gene_network2ws(meth, feature_set_id=None, out_id=None):
    """This method displays a gene list
    along with functional annotation in a table.

    :param feature_set_id: FeatureSet workspace object id
    :type feature_set_id: kbtypes.KBaseSearch.FeatureSet
    :param out_id: Output Networks object identifier
    :type out_id: kbtypes.KBaseNetworks.Network
    :return: New workspace object
    :rtype: kbtypes.Unicode
    :output_widget: ValueListWidget
    """
    # :param workspace_id: Workspace name (if empty, defaults to current workspace)
    # :type workspace_id: kbtypes.Unicode
    meth.stages = 3
    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("Retrieve genes from workspace")
    ws = Workspace2(token=meth.token, wsid=meth.workspace_id)
    fs = ws.get(feature_set_id)
    qid2cds = ids2cds(fs['elements'].keys())

    gl_str = ",".join(list(set(qid2cds.values())));

    meth.advance("Running GeneList to Networks")
    argsx = {"ws_id" : meth.workspace_id, "inobj_id" : gl_str,  "outobj_id": out_id}
    try:
        gl_oid = gc.genelist_to_networks(argsx)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    #if not gl_oid: # it may return empty string based on current script
    #    raise GWASException(2, "submit job failed, no job id")

    meth.advance("Returning object")
    return _workspace_output(out_id)

@method(name="FeatureSet Network Enrichment")
def featureset_net_enr(meth, feature_set_id=None, p_value=None, ref_wsid="KBasePublicNetwork", ref_network=None, out_id=None):
    """This method annotate GO terms and execute GO enrichment test 

    :param feature_set_id: FeatureSet workspace object id
    :type feature_set_id: kbtypes.KBaseSearch.FeatureSet
    :param p_value: p-value cutoff
    :type p_value: kbtypes.Unicode
    :param ref_wsid: Reference Network workspace id (optional, default to current workspace)
    :type ref_wsid: kbtypes.Unicode
    :param ref_network: Reference Network object name
    :type ref_network:kbtypes.KBaseNetworks.Network
    :param out_id: Output FeatureSet object identifier
    :type out_id: kbtypes.KBaseSearch.FeatureSet
    :return: New workspace object
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
    # :param workspace_id: Workspace name (if empty, defaults to current workspace)
    # :type workspace_id: kbtypes.Unicode
    meth.stages = 3
    meth.advance("Prepare Enrichment Test")

    # if not workspace_id:
    #     meth.debug("Workspace ID is empty, setting to current ({})".format(meth.workspace_id))
    #     workspace_id = meth.workspace_id
    
    oc = Ontology(url=URLS.ontology)
    ws = Workspace2(token=meth.token, wsid=meth.workspace_id)
    fs = ws.get(feature_set_id)
    if  not ref_wsid : ref_wsid = meth.workspace_id
    ws2 = Workspace2(token=meth.token, wsid=ref_wsid)
    net = ws2.get(ref_network)
    qid2cds = ids2cds(fs['elements'].keys())
    
    meth.advance("Execute Enrichment Test")
    enr_dict = oc.association_test(list(set(qid2cds.values())), ref_wsid, ref_network, '', 'hypergeometric', 'none', p_value)
    enr_list = sorted([(value,key) for (key,value) in enr_dict.items()])
 

    nid2name = {}
    for ne in net['nodes']:
      nid2name[ne['entity_id']] = ne['name'] 

    pwy_enr_smry = ""
    header = ["Pathway ID", "Name", "p-value"]
    fields = []
    for i in range(len(enr_list)):
      pwy_en = enr_list[i]
      if float(pwy_en[0]) > float(p_value) : continue
      fields.append([pwy_en[1], nid2name[pwy_en[1]], pwy_en[0]])
      #fs['fse.'+goen['goID']+".desc" ] = goen['goDesc'][0]
      #fs['fse.'+goen['goID']+".domain" ] = goen['goDesc'][1]
      #fs['fse.'+goen['goID']+".p_value" ] = `goen['pvalue']`
      if i < 3 :
        pwy_enr_smry += pwy_en[1]+"(" + "{:6.4f}".format(float(pwy_en[0])) + ")" + nid2name[pwy_en[1]] + "\n"
        #go_enr_anns[i] = goen['goID']+"(" + "{:6.4f}".format(goen['pvalue']) + ")" + goen['goDesc'][0]
    
      
    data = {'table': [header] + fields}
    meth.advance("Saving output to Workspace")

    ws.save_objects({'workspace' : meth.workspace_id, 'objects' :[{'type' : 'KBaseSearch.FeatureSet', 'data' : fs, 'name' : out_id, 'meta' : {'original' : feature_set_id, 'ref_wsid' : ref_wsid, 'ref_net' : ref_network, 'pwy_enr_summary' :pwy_enr_smry}}]})


    meth.advance("Returning object")
    return json.dumps(data)
    #return json.dumps({'values': [
    #                               ["Workspace object", out_id],
    #                               ["Enrichment Summary", pwy_enr_smry]
    #                             ]})


@method(name="Gene network")
def gene_network(meth, gene_list=None, external_ids=None):
    """This method searches KBase indexed co-expression networks where
        genes from the gene_list are present and displays internal networks formed by these genes in an interactive visualization.
        
        :param gene_list: GWAS Gene list
        :type gene_list: kbtypes.KBaseGwasData.GwasGeneList
        :param external_ids: Space delimited list of external IDs (optional. Use this or workspace id)
        :type external_ids: kbtypes.Unicode
        :return: Rows for display
        :rtype: kbtypes.Unicode
        :output_widget: kbasePlantsNetworkNarrative
        """
    #:param workspace_id: Workspace name (use current if empty)
    #:type workspace_id: kbtypes.Unicode
    meth.stages = 1
    # if not workspace_id:
    #     meth.debug("Workspace ID is empty, setting to current ({})".format(meth.workspace_id))
    #     workspace_id = meth.workspace_id
    meth.advance("Retrieve gene from workspace")
    if gene_list:
        ws = Workspace2(token=meth.token, wsid=meth.workspace_id)
        raw_data = ws.get(gene_list)
    else:
        raw_data = {}
    data = {'gwas': raw_data, 'external_ids' : external_ids}
    return json.dumps(data)



# Finalize (registers service)
finalize_service()
