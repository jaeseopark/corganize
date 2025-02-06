import TableView from "@/components/config/table";

const TemplateTableView = ({ templates, ...rest }: { templates: object }) => {
  const templatesAsArray: any[] = Object.entries(templates).map(([name, template]) => ({
    ...template,
    template_name: name,
  }));

  return <TableView items={templatesAsArray} nameProvider={(template) => template.template_name} {...rest} />;
};

export default TemplateTableView;
